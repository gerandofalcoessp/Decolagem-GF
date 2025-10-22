import { Router } from 'express';
import { getSupabaseForToken, getUserFromToken, supabaseAdmin } from '../services/supabaseClient.js';
import { getUserRegionalId, canUserSeeRegionalEvents } from '../services/regionalService.js';
import { z } from 'zod';
import { requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

// GET - Listar eventos de calendário
router.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });
  
  // Usar o usuário do middleware que já tem os dados completos
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  
  console.log(`[Calendar Events API] Usuário: ${user.email}, Regional: ${user.regional}`);
  
  // Verificar se foi solicitada a visualização global via query parameter
  const forceGlobal = req.query.global === 'true';
  
  // Verificar se é um usuário global ou se foi solicitado forçar visualização global
  const isGlobalUser = !user.regional || user.funcao === 'admin' || user.funcao === 'coordenador_geral';
  const shouldShowAllEvents = isGlobalUser || forceGlobal;
  
  let query = s
    .from('calendar_events')
    .select(`
      *,
      responsavel:usuarios!calendar_events_responsavel_id_fkey(
        id,
        nome,
        email,
        regional,
        funcao,
        area
      )
    `);
  
  // Buscar todos os eventos primeiro
  const { data: allEvents, error } = await query.order('data_inicio', { ascending: true });
  
  if (error) {
    console.error('[Calendar Events API] Erro ao buscar eventos:', error);
    return res.status(400).json({ error: error.message });
  }
  
  // Se for usuário global ou forçado global, retornar todos os eventos
  if (shouldShowAllEvents) {
    return res.json({ data: allEvents });
  }
  
  // Para usuários regionais, filtrar eventos usando o novo sistema de IDs
  const filteredEvents = [];
  
  for (const event of allEvents) {
    if (!event.regional) {
      // Eventos sem regional são visíveis para todos
      filteredEvents.push(event);
      continue;
    }
    
    try {
      const canSee = await canUserSeeRegionalEvents(user.regional, event.regional);
      if (canSee) {
        filteredEvents.push(event);
      }
    } catch (error) {
      console.error(`[Calendar Events API] Erro ao verificar permissão para evento ${event.id}:`, error);
      // Em caso de erro, não incluir o evento por segurança
    }
  }
  res.json({ data: filteredEvents });
});

// POST - Criar novo evento de calendário
router.post('/', requireRole(['super_admin', 'equipe_interna', 'user']), async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const body = req.body || {};
  const createSchema = z.object({
    titulo: z.string().min(1, 'titulo é obrigatório'),
    data_inicio: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'data_inicio deve ser uma data ISO válida'),
    descricao: z.string().min(1).optional().nullable(),
    data_fim: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'data_fim deve ser uma data ISO válida').optional().nullable(),
    local: z.string().min(1).optional().nullable(),
    regional: z.string().min(1).optional().nullable(),
    programa: z.string().min(1).optional().nullable(),
    responsavel_id: z.string().uuid().optional().nullable(),
    participantes_esperados: z.number().int().nonnegative().optional().nullable(),
    participantes_confirmados: z.number().int().nonnegative().optional().nullable(),
    quantidade: z.number().int().nonnegative().optional().nullable(),
    evidencias: z.any().optional().nullable(),
    status: z.string().min(1).optional().nullable(),
    observacoes: z.string().min(1).optional().nullable(),
  }).passthrough();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
  }

  // Tentar inserir com o cliente do usuário; se falhar por RLS, usar fallback com supabaseAdmin
  const { data: userData, error: userError } = await s
    .from('calendar_events')
    .insert(parsed.data)
    .select('*')
    .single();

  if (userError) {
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('calendar_events')
      .insert(parsed.data)
      .select('*')
      .single();

    if (adminError) return res.status(400).json({ error: adminError.message });
    return res.status(201).json({ data: adminData });
  }

  return res.status(201).json({ data: userData });
});

// PUT - Atualizar evento de calendário
router.put('/:id', requireRole(['super_admin', 'equipe_interna', 'user']), async (req, res) => {
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
  const updateSchema = createSchema.partial();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
  }

  const { data: userData, error: userError } = await s
    .from('calendar_events')
    .update(parsed.data)
    .eq('id', id)
    .select('*')
    .single();

  if (userError) {
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('calendar_events')
      .update(parsed.data)
      .eq('id', id)
      .select('*')
      .single();

    if (adminError) return res.status(400).json({ error: adminError.message });
    return res.json({ data: adminData });
  }

  return res.json({ data: userData });
});

// DELETE - Deletar evento de calendário
router.delete('/:id', requireRole(['super_admin', 'equipe_interna', 'user']), async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });
  
  const idSchema = z.string().min(1);
  const idParse = idSchema.safeParse(req.params.id);
  if (!idParse.success) {
    return res.status(400).json({ error: 'invalid_id', details: idParse.error.flatten() });
  }

  const { data: userData, error: userError } = await s
    .from('calendar_events')
    .delete()
    .eq('id', req.params.id)
    .select('*')
    .single();

  if (userError) {
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('calendar_events')
      .delete()
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (adminError) return res.status(400).json({ error: adminError.message });
    return res.json({ data: adminData });
  }

  return res.json({ data: userData });
});

export default router;