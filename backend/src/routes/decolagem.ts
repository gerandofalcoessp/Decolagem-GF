import { Router } from 'express';
import { getSupabaseForToken, getUserFromToken } from '../services/supabaseClient.js';

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
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /decolagem - Criar nova família
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

  const { data, error } = await s.from('familias_decolagem').insert(payload).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

// PUT /decolagem/:id - Atualizar família
router.put('/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const id = req.params.id;
  const body = req.body || {};
  if ('member_id' in body) delete body.member_id;
  const payload = body;

  const { data, error } = await s.from('familias_decolagem').update(payload).eq('id', id).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

// DELETE /decolagem/:id - Deletar família
router.delete('/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });
  
  const { data, error } = await s.from('familias_decolagem').delete().eq('id', req.params.id).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

export default router;