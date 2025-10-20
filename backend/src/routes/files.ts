import { Router } from 'express';
import { getSupabaseForToken, getUserFromToken } from '../services/supabaseClient.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';
import { requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });
  const { data, error } = await s.from('files').select('*');
  if (error) {
    logger.logDatabaseError('select', 'files', new Error(error.message));
    return res.status(400).json({ error: error.message });
  }
  res.json({ data });
});

router.post('/', requireRole('super_admin'), async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const { data: me, error: meErr } = await s.from('members').select('id').eq('auth_user_id', user.id).single();
  if (meErr || !me) return res.status(404).json({ error: 'member_not_found' });

  const body = req.body || {};
  const createFileSchema = z.object({}).passthrough().refine(obj => !('member_id' in obj), {
    message: 'member_id_not_allowed'
  });
  const parsed = createFileSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
  }

  const payload = { ...parsed.data, member_id: me.id };

  const { data, error } = await s.from('files').insert(payload).select('*').single();
  if (error) {
    logger.logDatabaseError('insert', 'files', new Error(error.message), user.id);
    return res.status(400).json({ error: error.message });
  }
  
  logger.info('File created successfully', {
    resource: 'files',
    userId: user.id,
    context: { fileId: data.id, memberId: me.id }
  });
  
  res.status(201).json({ data });
});

router.delete('/:id', requireRole('super_admin'), async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const idSchema = z.string().min(1);
  const idParse = idSchema.safeParse(req.params.id);
  if (!idParse.success) {
    return res.status(400).json({ error: 'invalid_id', details: idParse.error.flatten() });
  }

  const { data, error } = await s.from('files').delete().eq('id', idParse.data).select('*').single();
  if (error) {
    logger.logDatabaseError('delete', 'files', new Error(error.message));
    return res.status(400).json({ error: error.message });
  }
  
  logger.info('File deleted successfully', {
    resource: 'files',
    context: { fileId: req.params.id, deletedData: data }
  });
  
  res.json({ data });
});

export default router;