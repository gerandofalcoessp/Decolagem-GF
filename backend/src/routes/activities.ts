import { Router } from 'express';
import { getSupabaseForToken, getUserFromToken } from '../services/supabaseClient';

const router = Router();

router.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });
  
  // Fazer join com a tabela usuarios para obter dados do responsável
  const { data, error } = await s
    .from('activities')
    .select(`
      *,
      responsavel:usuarios!activities_responsavel_id_fkey(
        id,
        nome,
        email,
        regional,
        funcao,
        area
      )
    `);
    
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

  const { data, error } = await s.from('activities').insert(payload).select('*').single();
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

  const { data, error } = await s.from('activities').update(payload).eq('id', id).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

router.delete('/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });
  const { data, error } = await s.from('activities').delete().eq('id', req.params.id).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

export default router;