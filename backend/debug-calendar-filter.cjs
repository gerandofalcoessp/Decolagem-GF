const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugCalendarFilter() {
  try {
    console.log('🔍 Debugando filtro de calendário regional...');
    
    // 1. Buscar usuário Rio de Janeiro
    const { data: usuarios, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('regional', '%rio%');
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }
    
    console.log('👤 Usuários Rio de Janeiro encontrados:', usuarios.length);
    if (usuarios.length > 0) {
      const user = usuarios[0];
      console.log('- Nome:', user.nome);
      console.log('- Email:', user.email);
      console.log('- Regional:', user.regional);
      console.log('- Função:', user.funcao);
      console.log('- Role:', user.role);
      
      // 2. Verificar se é usuário global
      const isGlobalUser = !user.regional || user.regional === 'todas' || user.funcao === 'admin' || user.funcao === 'coordenador_geral';
      console.log('🌍 É usuário global?', isGlobalUser);
      
      // 3. Buscar todos os eventos
      const { data: allEvents, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .order('data_inicio', { ascending: true });
      
      if (eventsError) {
        console.error('❌ Erro ao buscar eventos:', eventsError);
        return;
      }
      
      console.log('📅 Total de eventos no banco:', allEvents.length);
      
      if (allEvents.length > 0) {
        console.log('\n📋 Eventos por regional:');
        const eventosPorRegional = {};
        allEvents.forEach(event => {
          const regional = event.regional || 'sem_regional';
          if (!eventosPorRegional[regional]) {
            eventosPorRegional[regional] = [];
          }
          eventosPorRegional[regional].push(event.titulo);
        });
        
        Object.keys(eventosPorRegional).forEach(regional => {
          console.log(`- ${regional}: ${eventosPorRegional[regional].length} eventos`);
          eventosPorRegional[regional].forEach((titulo, index) => {
            console.log(`  ${index + 1}. ${titulo}`);
          });
        });
      }
      
      // 4. Buscar tabela regionals para entender o mapeamento
      const { data: regionals, error: regionalsError } = await supabase
        .from('regionals')
        .select('*')
        .order('name');
      
      if (regionalsError) {
        console.error('❌ Erro ao buscar regionais:', regionalsError);
      } else {
        console.log('\n🏢 Regionais na tabela regionals:');
        regionals.forEach((regional, index) => {
          console.log(`${index + 1}. ID: ${regional.id}, Nome: ${regional.name}`);
        });
      }
      
      // 5. Testar a função canUserSeeRegionalEvents
      console.log('\n🔍 Testando função canUserSeeRegionalEvents...');
      
      // Simular a lógica da função
      const canUserSeeRegionalEvents = (userRegional, eventRegional) => {
        if (!userRegional || userRegional === 'todas') return true;
        if (userRegional === 'Nacional') return true;
        return userRegional.toLowerCase() === eventRegional?.toLowerCase();
      };
      
      allEvents.forEach(event => {
        const canSee = canUserSeeRegionalEvents(user.regional, event.regional);
        if (canSee) {
          console.log(`✅ Pode ver: ${event.titulo} (Regional: ${event.regional})`);
        } else {
          console.log(`❌ Não pode ver: ${event.titulo} (Regional: ${event.regional})`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugCalendarFilter();