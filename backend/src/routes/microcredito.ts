import { Router } from 'express';
import { getSupabaseForToken, getUserFromToken } from '../services/supabaseClient.js';

const router = Router();

// GET /microcredito - Retorna dados do programa Microcrédito
router.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  try {
    // Buscar empréstimos
    const { data: emprestimos, error: emprestimosError } = await s
      .from('emprestimos')
      .select('*')
      .order('created_at', { ascending: false });

    if (emprestimosError) {
      return res.status(400).json({ error: emprestimosError.message });
    }

    res.json({ 
      emprestimos: emprestimos || []
    });
  } catch (error: any) {
    console.error('Erro ao buscar dados do Microcrédito:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /microcredito - Criar novo empréstimo
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

  const { data, error } = await s.from('emprestimos').insert(payload).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

// PUT /microcredito/:id - Atualizar empréstimo
router.put('/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const id = req.params.id;
  const body = req.body || {};
  if ('member_id' in body) delete body.member_id;
  const payload = body;

  const { data, error } = await s.from('emprestimos').update(payload).eq('id', id).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

// DELETE /microcredito/:id - Deletar empréstimo
router.delete('/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });
  
  const { data, error } = await s.from('emprestimos').delete().eq('id', req.params.id).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

export default router;