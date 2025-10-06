const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testApiEndpoint() {
  try {
    console.log('🔍 Testando endpoint da API /api/calendar-events...');
    
    // Primeiro, buscar o usuário Nordeste 2
    const { data: usuarios, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'eduardo.neto@gerandofalcoes.com')
      .single();
    
    if (userError || !usuarios) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }
    
    console.log('👤 Usuário encontrado:', usuarios.email, '- Regional:', usuarios.regional);
    
    // Simular a lógica do endpoint
    const user = usuarios;
    const isGlobalUser = !user.regional || user.regional === 'todas' || user.funcao === 'admin' || user.funcao === 'coordenador_geral';
    
    console.log('🔍 Verificações:');
    console.log('- É usuário global?', isGlobalUser);
    console.log('- Regional do usuário:', user.regional);
    console.log('- Função do usuário:', user.funcao);
    
    // Normalizar regional
    const normalizeRegional = (regional) => {
      return regional.toLowerCase()
        .replace(/^r\.\s*/, '') // Remove "R. " do início
        .replace(/\s+/g, '_')   // Substitui espaços por underscore
        .replace(/-/g, '_');    // Substitui hífens por underscore
    };
    
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
    
    // Se não for usuário global, filtrar apenas eventos da regional do usuário
    if (!isGlobalUser && user.regional) {
      const normalizedUserRegional = normalizeRegional(user.regional);
      console.log('🔄 Aplicando filtro regional para:', normalizedUserRegional);
      
      // Filtrar eventos que correspondem à regional normalizada
      query = query.eq('regional', normalizedUserRegional);
    } else {
      console.log('🌍 Usuário global - sem filtro regional');
    }
    
    const { data, error } = await query.order('data_inicio', { ascending: true });
    
    if (error) {
      console.error('❌ Erro na consulta:', error);
      return;
    }
    
    console.log('📅 Eventos retornados pela API:', data.length);
    
    if (data.length > 0) {
      console.log('\n📋 Eventos encontrados:');
      data.forEach((event, index) => {
        console.log(`${index + 1}. ${event.titulo} (regional: ${event.regional})`);
      });
    } else {
      console.log('✅ Nenhum evento encontrado - comportamento esperado para Nordeste 2');
    }
    
    // Verificar todos os eventos no banco para comparação
    console.log('\n🔍 Verificando todos os eventos no banco:');
    const { data: allEvents, error: allError } = await supabase
      .from('calendar_events')
      .select('*');
    
    if (allError) {
      console.error('❌ Erro ao buscar todos os eventos:', allError);
      return;
    }
    
    console.log('📊 Total de eventos no banco:', allEvents.length);
    allEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.titulo} (regional: ${event.regional})`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testApiEndpoint();