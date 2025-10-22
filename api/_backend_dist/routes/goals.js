import { Router } from 'express';
import { getSupabaseForToken, getUserFromToken } from '../services/supabaseClient.js';
import { z } from 'zod';
import { requireRole } from '../middlewares/authMiddleware.js';
const router = Router();
router.get('/', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const s = getSupabaseForToken(token);
    if (!s)
        return res.status(500).json({ error: 'supabase_client_unavailable' });
    const user = await getUserFromToken(token);
    if (!user)
        return res.status(401).json({ error: 'unauthorized' });
    const { data: me, error: meErr } = await s.from('members').select('id, regional, area').eq('auth_user_id', user.id).single();
    if (meErr || !me)
        return res.status(404).json({ error: 'member_not_found' });
    // Verificar se o usuário é super_admin
    const userRole = user.user_metadata?.role;
    let query = s.from('goals').select('*');
    if (userRole === 'super_admin') {
        // Super admin vê todas as metas
        query = query;
    }
    else {
        // Otimização: buscar metas diretamente com filtros mais eficientes
        // Construir filtros para metas
        const filters = [];
        // 1. Metas próprias do usuário
        filters.push(`member_id.eq.${me.id}`);
        // 2. Para metas de super admins, usar uma abordagem mais simples
        // Buscar metas que contenham informações relevantes na descrição
        if (me.regional) {
            // Extrair palavras-chave da regional para busca
            const regionalKeywords = me.regional.split(/[\s\-\.]+/).filter(word => word.length > 2);
            for (const keyword of regionalKeywords) {
                filters.push(`descricao.ilike.*${keyword}*`);
            }
        }
        if (me.area && me.area !== me.regional) {
            // Extrair palavras-chave da área para busca
            const areaKeywords = me.area.split(/[\s\-\.]+/).filter(word => word.length > 2);
            for (const keyword of areaKeywords) {
                filters.push(`descricao.ilike.*${keyword}*`);
            }
        }
        // Aplicar todos os filtros com OR
        if (filters.length > 0) {
            query = query.or(filters.join(','));
        }
        else {
            // Se não há filtros, mostrar apenas as próprias metas
            query = query.eq('member_id', me.id);
        }
    }
    const { data, error } = await query;
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ data });
});
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
    const createGoalSchema = z.object({}).passthrough().refine(obj => !('member_id' in obj), {
        message: 'member_id_not_allowed'
    });
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    }
    const payload = { ...parsed.data, member_id: me.id };
    const { data, error } = await s.from('goals').insert(payload).select('*').single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.status(201).json({ data });
});
router.put('/:id', requireRole('super_admin'), async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const s = getSupabaseForToken(token);
    if (!s)
        return res.status(500).json({ error: 'supabase_client_unavailable' });
    const idSchema = z.string().min(1);
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
        return res.status(400).json({ error: 'invalid_id', details: idParse.error.flatten() });
    }
    const id = idParse.data;
    const body = req.body || {};
    const updateGoalSchema = z.object({}).passthrough().refine(obj => !('member_id' in obj), {
        message: 'member_id_not_allowed'
    });
    const parsed = updateGoalSchema.safeParse(body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    }
    const payload = parsed.data;
    const { data, error } = await s.from('goals').update(payload).eq('id', id).select('*').single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ data });
});
router.delete('/:id', requireRole('super_admin'), async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const s = getSupabaseForToken(token);
    if (!s)
        return res.status(500).json({ error: 'supabase_client_unavailable' });
    const idSchema = z.string().min(1);
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
        return res.status(400).json({ error: 'invalid_id', details: idParse.error.flatten() });
    }
    const { data, error } = await s.from('goals').delete().eq('id', req.params.id).select('*').single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ data });
});
export default router;
