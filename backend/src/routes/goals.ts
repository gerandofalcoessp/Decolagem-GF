import { Router } from 'express';
import { getSupabaseForToken, getUserFromToken } from '../services/supabaseClient.js';

const router = Router();

router.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const { data: me, error: meErr } = await s.from('members').select('id').eq('auth_user_id', user.id).single();
  if (meErr || !me) return res.status(404).json({ error: 'member_not_found' });

  // Verificar se o usuário é super_admin
  const userRole = user.user_metadata?.role;
  let query = s.from('goals').select('*');
  
  if (userRole === 'super_admin') {
    // Super admin vê todas as metas
    query = query;
  } else {
    // Usuários normais veem apenas suas próprias metas
    query = query.eq('member_id', me.id);
  }

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

router.post('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const { data: me, error: meErr } = await s.from('members').select('id').eq('auth_user_id', user.id).single();
  if (meErr || !me) return res.status(404).json({ error: 'member_not_found' });

  const body = req.body || {};
  const payload = { ...body, member_id: me.id };

  const { data, error } = await s.from('goals').insert(payload).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

router.put('/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const id = req.params.id;
  const body = req.body || {};
  if ('member_id' in body) delete body.member_id;
  const payload = body;

  const { data, error } = await s.from('goals').update(payload).eq('id', id).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

router.delete('/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });
  const { data, error } = await s.from('goals').delete().eq('id', req.params.id).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

export default router;