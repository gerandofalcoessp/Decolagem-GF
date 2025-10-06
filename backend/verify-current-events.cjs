const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyCurrentEvents() {
  try {
    console.log('🔍 Verificando estado atual dos eventos no banco...\n');
    
    // Buscar todos os eventos
    const { data: eventos, error: eventError } = await supabase
      .from('calendar_events')
      .select(`
        *,
        responsavel:usuarios!calendar_events_responsavel_id_fkey(
          id,
          nome,
          email,
          regional,
          funcao
        )
      `)
      .order('created_at', { ascending: false });
    
    if (eventError) {
      console.error('❌ Erro ao buscar eventos:', eventError);
      return;
    }
    
    console.log(`📊 Total de eventos no banco: ${eventos.length}\n`);
    
    if (eventos.length === 0) {
      console.log('❌ Nenhum evento encontrado no banco de dados');
      return;
    }
    
    // Mostrar detalhes de cada evento
    eventos.forEach((evento, index) => {
      console.log(`📅 Evento ${index + 1}:`);
      console.log(`   - ID: ${evento.id}`);
      console.log(`   - Título: ${evento.titulo}`);
      console.log(`   - Regional do evento: "${evento.regional}"`);
      console.log(`   - Data: ${evento.data_inicio}`);
      console.log(`   - Responsável: ${evento.responsavel?.nome || 'N/A'}`);
      console.log(`   - Regional do responsável: "${evento.responsavel?.regional || 'N/A'}"`);
      console.log(`   - Criado em: ${evento.created_at}`);
      console.log('');
    });
    
    // Verificar se há eventos duplicados ou com regionais diferentes
    const regionaisEventos = eventos.map(e => e.regional);
    const regionaisUnicas = [...new Set(regionaisEventos)];
    
    console.log('🏢 Regionais dos eventos:');
    regionaisUnicas.forEach((regional, index) => {
      const count = regionaisEventos.filter(r => r === regional).length;
      console.log(`   ${index + 1}. "${regional}" (${count} evento${count > 1 ? 's' : ''})`);
    });
    
    // Verificar especificamente eventos para "nordeste_2"
    const eventosNordeste2 = eventos.filter(e => e.regional === 'nordeste_2');
    console.log(`\n🔍 Eventos para regional "nordeste_2": ${eventosNordeste2.length}`);
    
    if (eventosNordeste2.length > 0) {
      console.log('⚠️  PROBLEMA ENCONTRADO: Existem eventos para nordeste_2!');
      eventosNordeste2.forEach((evento, index) => {
        console.log(`   ${index + 1}. ${evento.titulo} (ID: ${evento.id})`);
      });
    } else {
      console.log('✅ Correto: Não há eventos para nordeste_2 no banco');
    }
    
    // Verificar eventos para "norte"
    const eventosNorte = eventos.filter(e => e.regional === 'norte');
    console.log(`\n🔍 Eventos para regional "norte": ${eventosNorte.length}`);
    
    if (eventosNorte.length > 0) {
      eventosNorte.forEach((evento, index) => {
        console.log(`   ${index + 1}. ${evento.titulo} (ID: ${evento.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

verifyCurrentEvents();