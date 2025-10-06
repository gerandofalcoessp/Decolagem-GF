const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugCalendarAPI() {
  try {
    console.log('🔍 Testando API de eventos do calendário...\n');
    
    // 1. Buscar usuário Rio de Janeiro
    const { data: usuarios, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('regional', '%rio%');
    
    if (userError || !usuarios.length) {
      console.error('❌ Erro ao buscar usuário Rio de Janeiro:', userError);
      return;
    }
    
    const user = usuarios[0];
    console.log('👤 Usuário encontrado:', user.nome, '- Regional:', user.regional);
    
    // 2. Simular a lógica do endpoint /api/calendar-events
    console.log('\n🔍 Simulando lógica do endpoint /api/calendar-events...');
    
    // Verificar se é usuário global
    const isGlobalUser = !user.regional || user.regional === 'todas' || user.funcao === 'admin' || user.funcao === 'coordenador_geral';
    console.log('🌍 É usuário global?', isGlobalUser);
    
    // Buscar todos os eventos
    const { data: allEvents, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')
      .order('data_inicio', { ascending: true });
    
    if (eventsError) {
      console.error('❌ Erro ao buscar eventos:', eventsError);
      return;
    }
    
    console.log('📅 Total de eventos no banco:', allEvents.length);
    
    if (isGlobalUser) {
      console.log('✅ Usuário global - retornaria todos os eventos');
      return;
    }
    
    // 3. Aplicar filtro regional (simular canUserSeeRegionalEvents)
    console.log('\n🔍 Aplicando filtro regional...');
    
    // Implementar as funções de mapeamento diretamente
    const userToRegionalMapping = {
      'R. Rio de Janeiro': 'Rio de Janeiro',
      'R. Norte': 'Norte',
      'R. Nordeste 1': 'Nordeste 1',
      'R. Nordeste 2': 'Nordeste 2',
      'R. Centro-Oeste': 'Centro-Oeste',
      'R. Sudeste': 'Sudeste',
      'R. Sul': 'Sul',
      'Nacional': 'Nacional'
    };
    
    const eventToRegionalMapping = {
      'rj': 'Rio de Janeiro',
      'norte': 'Norte',
      'nordeste_1': 'Nordeste 1',
      'nordeste_2': 'Nordeste 2',
      'centro_oeste': 'Centro-Oeste',
      'sudeste': 'Sudeste',
      'sul': 'Sul',
      'nacional': 'Nacional'
    };
    
    function getUserRegionalId(userRegional) {
      return userToRegionalMapping[userRegional] || null;
    }
    
    function getEventRegionalId(eventRegional) {
      return eventToRegionalMapping[eventRegional] || null;
    }
    
    const filteredEvents = [];
    
    for (const event of allEvents) {
      try {
        const userRegionalId = getUserRegionalId(user.regional);
        const eventRegionalId = getEventRegionalId(event.regional);
        
        console.log(`\n📋 Evento: ${event.titulo}`);
        console.log(`   - Regional do evento: ${event.regional}`);
        console.log(`   - ID regional do usuário: ${userRegionalId}`);
        console.log(`   - ID regional do evento: ${eventRegionalId}`);
        
        // Verificar se pode ver o evento
        let canSee = false;
        
        if (userRegionalId && eventRegionalId && userRegionalId === eventRegionalId) {
          canSee = true;
        }
        
        // Usuários "Nacional" podem ver todos os eventos
        if (user.regional && user.regional.toLowerCase().includes('nacional')) {
          canSee = true;
        }
        
        console.log(`   - Pode ver? ${canSee ? '✅ SIM' : '❌ NÃO'}`);
        
        if (canSee) {
          filteredEvents.push(event);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar evento ${event.titulo}:`, error);
      }
    }
    
    console.log(`\n📊 Resultado final:`);
    console.log(`   - Eventos totais: ${allEvents.length}`);
    console.log(`   - Eventos filtrados: ${filteredEvents.length}`);
    
    if (filteredEvents.length > 0) {
      console.log('\n✅ Eventos que o usuário deveria ver:');
      filteredEvents.forEach((event, index) => {
        console.log(`${index + 1}. ${event.titulo} (Regional: ${event.regional})`);
      });
    } else {
      console.log('\n❌ Nenhum evento deveria ser exibido para este usuário');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugCalendarAPI();