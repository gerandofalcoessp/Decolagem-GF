const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTotalFamilias() {
  try {
    console.log('🔍 Consultando famílias embarcadas no banco de dados...\n');
    
    // Buscar famílias ativas
    const { data: familiasAtivas, error: ativasError } = await supabase
      .from('familias_decolagem')
      .select('*')
      .eq('status', 'ativo');

    // Buscar todas as famílias (independente do status)
    const { data: todasFamilias, error: todasError } = await supabase
      .from('familias_decolagem')
      .select('*');

    if (ativasError || todasError) {
      console.error('❌ Erro:', ativasError?.message || todasError?.message);
      return;
    }

    console.log('📊 RESUMO DAS FAMÍLIAS EMBARCADAS:');
    console.log('═══════════════════════════════════════');
    console.log(`🟢 Famílias ATIVAS: ${familiasAtivas?.length || 0}`);
    console.log(`📋 Total de famílias (todos os status): ${todasFamilias?.length || 0}`);

    if (familiasAtivas && familiasAtivas.length > 0) {
      const totalMembros = familiasAtivas.reduce((sum, familia) => sum + (familia.numero_membros || 0), 0);
      const rendaTotal = familiasAtivas.reduce((sum, familia) => sum + (familia.renda_familiar || 0), 0);
      const rendaMedia = rendaTotal / familiasAtivas.length;

      console.log(`\n👥 Total de membros das famílias ativas: ${totalMembros}`);
      console.log(`💰 Renda média das famílias: R$ ${rendaMedia.toFixed(2)}`);
      
      console.log(`\n📋 Detalhes das famílias ativas:`);
      familiasAtivas.forEach((familia, index) => {
        console.log(`  ${index + 1}. ${familia.nome_responsavel} - ${familia.numero_membros} membros - R$ ${familia.renda_familiar}`);
      });
    }

    // Verificar se existem famílias com outros status
    if (todasFamilias && todasFamilias.length > 0) {
      const statusCount = {};
      todasFamilias.forEach(familia => {
        const status = familia.status || 'sem_status';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      console.log(`\n📈 Distribuição por status:`);
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`  • ${status}: ${count} famílias`);
      });
    }

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

getTotalFamilias();