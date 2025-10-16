import { Router } from 'express';
import { getSupabaseForToken, getUserFromToken } from '../services/supabaseClient.js';

const router = Router();

// Função para mapear regional do usuário para formato das atividades
const mapUserRegionalToActivityFormat = (userRegional: string): string => {
  if (!userRegional) return 'nacional';
  
  const mapping: Record<string, string> = {
    'nacional': 'nacional',
    'comercial': 'comercial',
    'centro_oeste': 'centro_oeste',
    'mg_es': 'mg_es',
    'nordeste_1': 'nordeste_1',
    'nordeste_2': 'nordeste_2',
    'norte': 'norte',
    'rj': 'rj',
    'sp': 'sp',
    'sul': 'sul'
  };
  
  return mapping[userRegional.toLowerCase()] || userRegional.toLowerCase();
};

router.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  // Obter informações do usuário para aplicar filtros baseados em role
  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  console.log('🔍 Usuário fazendo requisição para /api/atividades:', {
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role,
    regional: user.user_metadata?.regional
  });

  const userRole = user.user_metadata?.role;
  const userRegional = user.user_metadata?.regional;

  const mappedUserRegional = mapUserRegionalToActivityFormat(userRegional);
  console.log('🔄 Mapeamento regional:', { original: userRegional, mapped: mappedUserRegional });

  let query = s
    .from('regional_activities')
    .select(`
      *,
      responsavel:usuarios!regional_activities_responsavel_id_fkey(
        id,
        nome,
        email,
        regional,
        funcao,
        area
      )
    `)
    .order('created_at', { ascending: false });

  // Se o usuário é super_admin ou nacional, buscar todas as atividades
  // Caso contrário, filtrar pela regional mapeada do usuário
  if (userRole !== 'super_admin' && mappedUserRegional !== 'nacional') {
    console.log('👤 Usuário comum - filtrando por regional:', mappedUserRegional);
    query = query.eq('regional', mappedUserRegional);
  } else {
    console.log('👑 Super admin ou usuário nacional - buscando todas as atividades');
  }

  const { data, error } = await query;

  console.log('📊 Resultado da query:', { data: data?.length || 0, error });
    
  if (error) return res.status(400).json({ error: error.message });
  
  // Mapear os dados para o formato esperado pelo frontend
  const mappedData = data?.map(activity => ({
    id: activity.id,
    titulo: activity.title,
    descricao: activity.description,
    activity_date: activity.activity_date,
    tipo: activity.type,
    atividade_label: activity.atividade_label,
    quantidade: activity.quantidade,
    regional: activity.regional,
    status: activity.status,
    created_at: activity.created_at,
    responsavel: activity.responsavel
  })) || [];
  
  res.json({ data: mappedData });
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