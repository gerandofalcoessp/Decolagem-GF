const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function removeIncorrectEvent() {
  try {
    console.log('🔍 Verificando evento formacao_ligas...');
    
    // Primeiro, verificar o evento
    const { data: event, error: fetchError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', 'd07020ae-a6e9-426f-a0f6-02350518aca4')
      .single();
    
    if (fetchError) {
      console.error('❌ Erro ao buscar evento:', fetchError);
      return;
    }
    
    if (!event) {
      console.log('ℹ️  Evento não encontrado - pode já ter sido removido');
      return;
    }
    
    console.log('📅 Evento encontrado:');
    console.log('- ID:', event.id);
    console.log('- Título:', event.titulo);
    console.log('- Regional:', event.regional);
    console.log('- Data:', event.data_inicio);
    
    // Confirmar remoção
    console.log('\n🗑️  Removendo evento...');
    
    const { data: deletedEvent, error: deleteError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', 'd07020ae-a6e9-426f-a0f6-02350518aca4')
      .select('*')
      .single();
    
    if (deleteError) {
      console.error('❌ Erro ao remover evento:', deleteError);
      return;
    }
    
    console.log('✅ Evento removido com sucesso!');
    console.log('- Evento removido:', deletedEvent.titulo);
    
    // Verificar se ainda existem eventos
    const { data: remainingEvents, error: countError } = await supabase
      .from('calendar_events')
      .select('id, titulo, regional')
      .order('created_at', { ascending: false });
    
    if (countError) {
      console.error('❌ Erro ao verificar eventos restantes:', countError);
      return;
    }
    
    console.log(`\n📊 Total de eventos restantes: ${remainingEvents.length}`);
    
    if (remainingEvents.length > 0) {
      console.log('\n📅 Eventos restantes:');
      remainingEvents.forEach((evt, index) => {
        console.log(`${index + 1}. ${evt.titulo} (${evt.regional})`);
      });
    } else {
      console.log('✅ Nenhum evento restante no banco de dados');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

removeIncorrectEvent();