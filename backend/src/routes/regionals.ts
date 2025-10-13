import { Router } from 'express';
import { getSupabaseForToken, supabaseAdmin } from '../services/supabaseClient.js';

const router = Router();

// GET /regionals - Buscar todas as regionais
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const supabase = getSupabaseForToken(token);
    
    if (!supabase) {
      return res.status(500).json({ error: 'supabase_client_unavailable' });
    }

    const { data, error } = await supabase
      .from('regionals')
      .select('*')
      .order('name');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ data });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'unknown_error' });
  }
});

// GET /regionals/users - Listar usuários com dados mínimos para cards regionais
router.get('/users', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'supabase_admin_unavailable' });
    }

    const requester = (req as any).user || {};
    const memberData = requester.memberData || {};
    const requesterRole: string | null = memberData.role ?? requester.role ?? null;
    const requesterRegionalRaw: string | null = memberData.regional ?? requester.regional ?? null;

    const normalizeRegional = (r: string): string => {
      let s = (r || '').trim();
      if (s.toLowerCase().startsWith('r. ')) {
        s = s.slice(3); // remove prefix "R. "
      }
      return s;
    };

    let query = supabaseAdmin
      .from('usuarios')
      .select('id, auth_user_id, email, role, nome, regional, area, tipo, funcao, status');

    // Se não for super_admin, filtra pela regional do solicitante
    if (requesterRole !== 'super_admin') {
      if (!requesterRegionalRaw) {
        // Sem regional definida: retorna vazio para evitar exposição indevida
        return res.json({ users: [] });
      }
      const userRegional = normalizeRegional(requesterRegionalRaw);
      // Filtrar por correspondências em 'regional' e 'area', considerando variações com prefixo "R. "
      const conditions = [
        `regional.eq.${userRegional}`,
        `regional.eq.R. ${userRegional}`,
        `area.eq.${userRegional}`,
        `area.eq.R. ${userRegional}`,
      ].join(',');
      query = query.or(conditions);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const users = (data || []).map((u: any) => ({
      id: u.id,
      auth_user_id: u.auth_user_id,
      email: u.email,
      role: u.role || 'viewer',
      nome: u.nome || u.email,
      regional: u.regional || null,
      area: u.area || null,
      tipo: u.tipo || null,
      funcao: u.funcao || null,
      status: u.status || 'ativo',
    }));

    return res.json({ users });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'unknown_error' });
  }
});

export default router;