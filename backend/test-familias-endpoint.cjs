const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFamiliasEndpoint() {
  try {
    console.log('🧪 Testando endpoint de famílias embarcadas...\n');
    
    // Simular a mesma lógica do endpoint
    const { data: familiasDecolagemData, error: familiasError } = await supabase
      .from('activities')
      .select('quantidade')
      .eq('atividade_label', 'Famílias Embarcadas Decolagem');

    if (familiasError) {
      console.error('❌ Erro ao buscar famílias:', familiasError.message);
      return;
    }

    console.log(`📊 Registros encontrados: ${familiasDecolagemData?.length || 0}`);
    
    if (familiasDecolagemData && familiasDecolagemData.length > 0) {
      console.log('\nPrimeiros registros:');
      familiasDecolagemData.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. Quantidade: ${item.quantidade}`);
      });
      
      const familiasEmbarcadas = familiasDecolagemData.reduce((sum, item) => sum + (item.quantidade || 0), 0);
      console.log(`\n✅ TOTAL DE FAMÍLIAS EMBARCADAS DECOLAGEM: ${familiasEmbarcadas}`);
    } else {
      console.log('❌ Nenhum registro encontrado');
      
      // Verificar se existem registros similares
      const { data: similarData, error: similarError } = await supabase
        .from('activities')
        .select('atividade_label, quantidade')
        .ilike('atividade_label', '%decolagem%')
        .limit(10);
        
      if (!similarError && similarData && similarData.length > 0) {
        console.log('\n🔍 Registros similares encontrados:');
        similarData.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.atividade_label}: ${item.quantidade}`);
        });
      }
    }

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

testFamiliasEndpoint();