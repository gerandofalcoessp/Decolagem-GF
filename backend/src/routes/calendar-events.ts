import { Router } from 'express';
import { getSupabaseForToken, getUserFromToken } from '../services/supabaseClient';
import { getUserRegionalId, canUserSeeRegionalEvents } from '../services/regionalService';

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
router.post('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const body = req.body || {};
  const { data, error } = await s.from('calendar_events').insert(body).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

// PUT - Atualizar evento de calendário
router.put('/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const id = req.params.id;
  const body = req.body || {};
  const { data, error } = await s.from('calendar_events').update(body).eq('id', id).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

// DELETE - Deletar evento de calendário
router.delete('/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });
  
  const { data, error } = await s.from('calendar_events').delete().eq('id', req.params.id).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

export default router;