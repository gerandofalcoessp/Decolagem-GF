const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCalendarEvents() {
  try {
    console.log('🔍 Verificando eventos de calendário no banco de dados...');
    
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar eventos:', error);
      return;
    }
    
    console.log('📊 Total de eventos encontrados:', events.length);
    
    if (events.length > 0) {
      console.log('\n📅 Eventos encontrados:');
      events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.atividade || event.titulo || 'Sem título'}`);
        console.log(`   - ID: ${event.id}`);
        console.log(`   - Regional: ${event.regional || 'N/A'}`);
        console.log(`   - Data: ${event.data_inicio}`);
        console.log(`   - Responsável ID: ${event.responsavel_id || 'N/A'}`);
        console.log(`   - Criado em: ${event.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum evento encontrado na tabela calendar_events');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkCalendarEvents();