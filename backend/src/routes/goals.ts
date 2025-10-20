import { Router } from 'express';
import { getSupabaseForToken, getUserFromToken, supabaseAdmin } from '../services/supabaseClient.js';
import { z } from 'zod';
import { requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const { data: me, error: meErr } = await s.from('members').select('id, regional, area').eq('auth_user_id', user.id).single();
  if (meErr || !me) return res.status(404).json({ error: 'member_not_found' });

  // Verificar se o usuário é super_admin
  const userRole = user.user_metadata?.role;
  let query = s.from('goals').select('*');
  
  if (userRole === 'super_admin') {
    // Super admin vê todas as metas
    query = query;
  } else {
    // Usuários normais veem suas próprias metas + metas criadas por super admins + metas da sua regional/área
    // Primeiro, buscar todos os members que são super admins
    const { data: superAdminMembers, error: superAdminError } = await s
      .from('members')
      .select('id, auth_user_id')
      .not('auth_user_id', 'is', null);
    
    if (superAdminError) {
      return res.status(500).json({ error: 'failed_to_fetch_super_admins' });
    }
    
    // Verificar quais members são super admins consultando auth.users
    const superAdminMemberIds = [];
    for (const member of superAdminMembers) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(member.auth_user_id);
        if (!userError && userData.user?.user_metadata?.role === 'super_admin') {
          superAdminMemberIds.push(member.id);
        }
      } catch (error) {
        // Ignorar erros individuais de usuários
        console.warn(`Erro ao verificar usuário ${member.auth_user_id}:`, error);
      }
    }
    
    // Construir filtros para metas
    const filters = [];
    
    // 1. Metas próprias do usuário
    filters.push(`member_id.eq.${me.id}`);
    
    // 2. Metas criadas por super admins que são relevantes para o usuário
    if (superAdminMemberIds.length > 0) {
      // Se o usuário tem regional ou área, filtrar metas de super admins por essas informações
      if (me.regional || me.area) {
        // Metas de super admins que contenham "Rio" na descrição (simplificado)
        if (me.regional && me.regional.includes('Rio')) {
          filters.push(`and(member_id.in.(${superAdminMemberIds.join(',')}),descricao.ilike.*Rio*)`);
        }
        
        // Metas de super admins que contenham a área na descrição (se diferente da regional)
        if (me.area && me.area !== me.regional) {
          filters.push(`and(member_id.in.(${superAdminMemberIds.join(',')}),descricao.ilike.*${me.area}*)`);
        }
      } else {
        // Se não tem regional/área, mostrar todas as metas de super admins
        filters.push(`member_id.in.(${superAdminMemberIds.join(',')})`);
      }
    }
    
    // Aplicar todos os filtros com OR
    if (filters.length > 0) {
      query = query.or(filters.join(','));
    } else {
      // Se não há filtros, mostrar apenas as próprias metas
      query = query.eq('member_id', me.id);
    }
  }

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
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

  const createGoalSchema = z.object({}).passthrough().refine(obj => !('member_id' in obj), {
    message: 'member_id_not_allowed'
  });
  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
  }

  const payload = { ...parsed.data, member_id: me.id };

  const { data, error } = await s.from('goals').insert(payload).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

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
  const updateGoalSchema = z.object({}).passthrough().refine(obj => !('member_id' in obj), {
    message: 'member_id_not_allowed'
  });
  const parsed = updateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
  }
  const payload = parsed.data;

  const { data, error } = await s.from('goals').update(payload).eq('id', id).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
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

  const { data, error } = await s.from('goals').delete().eq('id', req.params.id).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

export default router;