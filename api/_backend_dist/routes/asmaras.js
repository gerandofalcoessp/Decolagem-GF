import { Router } from 'express';
import { getSupabaseForToken, getUserFromToken } from '../services/supabaseClient.js';
import { requireRole } from '../middlewares/authMiddleware.js';
const router = Router();
// GET /asmaras - Retorna dados do programa As Maras
router.get('/', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const s = getSupabaseForToken(token);
    if (!s)
        return res.status(500).json({ error: 'supabase_client_unavailable' });
    try {
        // Buscar participantes
        const { data: participantes, error: participantesError } = await s
            .from('participantes_asmaras')
            .select('*')
            .order('created_at', { ascending: false });
        if (participantesError) {
            return res.status(400).json({ error: participantesError.message });
        }
        // Retorna array direto para compatibilidade com o frontend
        res.json(participantes || []);
    }
    catch (error) {
        console.error('Erro ao buscar dados do As Maras:', error);
        res.status(500).json({ error: 'internal_server_error' });
    }
});
// POST /asmaras - Criar novo participante
router.post('/', requireRole('super_admin'), async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const s = getSupabaseForToken(token);
    if (!s)
        return res.status(500).json({ error: 'supabase_client_unavailable' });
    const user = await getUserFromToken(token);
    if (!user)
        return res.status(401).json({ error: 'unauthorized' });
    const { data: me, error: meErr } = await s.from('members').select('id').eq('auth_user_id', user.id).single();
    if (meErr || !me)
        return res.status(404).json({ error: 'member_not_found' });
    const body = req.body || {};
    const payload = { ...body, member_id: me.id };
    const { data, error } = await s.from('participantes_asmaras').insert(payload).select('*').single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.status(201).json({ data });
});
// PUT /asmaras/:id - Atualizar participante
router.put('/:id', requireRole('super_admin'), async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const s = getSupabaseForToken(token);
    if (!s)
        return res.status(500).json({ error: 'supabase_client_unavailable' });
    const id = req.params.id;
    const body = req.body || {};
    if ('member_id' in body)
        delete body.member_id;
    const payload = body;
    const { data, error } = await s.from('participantes_asmaras').update(payload).eq('id', id).select('*').single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ data });
});
// DELETE /asmaras/:id - Deletar participante
router.delete('/:id', requireRole('super_admin'), async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const s = getSupabaseForToken(token);
    if (!s)
        return res.status(500).json({ error: 'supabase_client_unavailable' });
    const { data, error } = await s.from('participantes_asmaras').delete().eq('id', req.params.id).select('*').single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ data });
});
export default router;
