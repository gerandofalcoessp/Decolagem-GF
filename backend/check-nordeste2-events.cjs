const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Função para normalizar regional (mesma do backend)
function normalizeRegional(regional) {
  if (!regional) return '';
  return regional
    .toLowerCase()
    .replace(/^r\.\s*/, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

async function checkEventsForNordeste2() {
  try {
    console.log('🔍 Verificando eventos para usuário Nordeste 2...\n');
    
    // 1. Buscar usuário Nordeste 2
    const { data: usuarios, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('regional', '%nordeste%2%');
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }
    
    console.log('👤 Usuário Nordeste 2 encontrado:');
    if (usuarios.length > 0) {
      const user = usuarios[0];
      console.log('- Nome:', user.nome);
      console.log('- Email:', user.email);
      console.log('- Regional original:', user.regional);
      
      const normalizedRegional = normalizeRegional(user.regional);
      console.log('- Regional normalizada:', normalizedRegional);
      
      // 2. Simular a consulta do backend
      console.log('\n🔍 Simulando consulta do backend...');
      
      let query = supabase
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
      
      // Aplicar filtro regional (como no backend)
      const isGlobalUser = !user.regional || user.regional === 'todas' || user.funcao === 'admin' || user.funcao === 'coordenador_geral';
      
      console.log('- É usuário global?', isGlobalUser);
      
      if (!isGlobalUser && user.regional) {
        console.log('- Aplicando filtro regional para:', normalizedRegional);
        query = query.eq('regional', normalizedRegional);
      }
      
      const { data: events, error: eventError } = await query.order('data_inicio', { ascending: true });
      
      if (eventError) {
        console.error('❌ Erro ao buscar eventos:', eventError);
        return;
      }
      
      console.log('\n📅 Eventos retornados pelo backend:', events.length);
      
      if (events.length > 0) {
        events.forEach((event, index) => {
          console.log(`${index + 1}. ${event.titulo}`);
          console.log(`   - ID: ${event.id}`);
          console.log(`   - Regional: ${event.regional}`);
          console.log(`   - Data: ${event.data_inicio}`);
          console.log(`   - Responsável: ${event.responsavel?.nome || 'N/A'}`);
          console.log('');
        });
      } else {
        console.log('✅ Nenhum evento encontrado - comportamento correto!');
        console.log('   O usuário Nordeste 2 não deveria ver eventos de outras regionais.');
      }
      
      // 3. Verificar todos os eventos no banco
      console.log('\n📊 Todos os eventos no banco:');
      const { data: allEvents, error: allError } = await supabase
        .from('calendar_events')
        .select('id, titulo, regional')
        .order('created_at');
      
      if (allError) {
        console.error('❌ Erro ao buscar todos os eventos:', allError);
        return;
      }
      
      console.log('Total de eventos no banco:', allEvents.length);
      allEvents.forEach((event, index) => {
        console.log(`${index + 1}. ${event.titulo} (regional: ${event.regional})`);
      });
      
    } else {
      console.log('❌ Usuário Nordeste 2 não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkEventsForNordeste2();