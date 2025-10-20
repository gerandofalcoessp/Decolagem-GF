import { Router } from 'express';
import { getSupabaseForToken, getUserFromToken } from '../services/supabaseClient.js';
import { z } from 'zod';
import { requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

// GET /decolagem - Retorna dados do programa Decolagem
router.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  try {
    // Buscar famílias
    const { data: familias, error: familiasError } = await s
      .from('familias_decolagem')
      .select('*')
      .order('created_at', { ascending: false });

    if (familiasError) {
      return res.status(400).json({ error: familiasError.message });
    }

    // Retorna array direto para compatibilidade com o frontend
    res.json(familias || []);
  } catch (error: any) {
    console.error('Erro ao buscar dados do Decolagem:', error);
    res.status(500).json({ error: 'internal_server_error' });
  }
});

// POST /decolagem - Criar nova família
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
  const createSchema = z.object({}).passthrough().refine(obj => !('member_id' in obj), {
    message: 'member_id_not_allowed'
  });
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
  }

  const payload = { ...parsed.data, member_id: me.id };

  const { data, error } = await s.from('familias_decolagem').insert(payload).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

// PUT /decolagem/:id - Atualizar família
router.put('/:id', requireRole('super_admin'), async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const idSchema = z.string().min(1);
  const idParse = idSchema.safeParse(req.params.id);
  if (!idParse.success) {
    return res.status(400).json({ error: 'invalid_id', details: idParse.error.flatten() });
  }
  const id = idParse.data;

  const body = req.body || {};
  const updateSchema = z.object({}).passthrough().refine(obj => !('member_id' in obj), {
    message: 'member_id_not_allowed'
  });
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
  }
  const payload = parsed.data;

  const { data, error } = await s.from('familias_decolagem').update(payload).eq('id', id).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

// DELETE /decolagem/:id - Deletar família
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
  
  const { data, error } = await s.from('familias_decolagem').delete().eq('id', req.params.id).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

export default router;