const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugEventCreation() {
  try {
    console.log('🔍 Verificando detalhes do evento formacao_ligas...');
    
    // Buscar o evento específico com todos os detalhes
    const { data: event, error } = await supabase
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
      `)
      .eq('id', 'd07020ae-a6e9-426f-a0f6-02350518aca4')
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar evento:', error);
      return;
    }
    
    console.log('📅 Detalhes completos do evento:');
    console.log('- ID:', event.id);
    console.log('- Título:', event.titulo);
    console.log('- Regional do evento:', event.regional);
    console.log('- Data início:', event.data_inicio);
    console.log('- Data fim:', event.data_fim);
    console.log('- Responsável ID:', event.responsavel_id);
    console.log('- Criado em:', event.created_at);
    console.log('- Atualizado em:', event.updated_at);
    
    if (event.responsavel) {
      console.log('\n👤 Dados do responsável:');
      console.log('- Nome:', event.responsavel.nome);
      console.log('- Email:', event.responsavel.email);
      console.log('- Regional do responsável:', event.responsavel.regional);
      console.log('- Função:', event.responsavel.funcao);
    }
    
    // Verificar se há inconsistência
    if (event.regional !== event.responsavel?.regional) {
      console.log('\n⚠️  INCONSISTÊNCIA DETECTADA:');
      console.log(`- Regional do evento: ${event.regional}`);
      console.log(`- Regional do responsável: ${event.responsavel?.regional}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugEventCreation();