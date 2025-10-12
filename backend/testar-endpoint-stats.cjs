const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testarEndpointStats() {
  try {
    console.log('🧪 TESTANDO ENDPOINT /api/instituicoes/stats');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    // Simular a lógica do endpoint atualizado
    console.log('🔍 1. Testando consulta direta na tabela regional_activities...\n');
    
    const { data: atividadesFamiliasData, error: atividadesError } = await supabase
      .from('regional_activities')
      .select('quantidade, regional, activity_date')
      .eq('atividade_label', 'Famílias Embarcadas Decolagem')
      .eq('status', 'ativo');

    if (atividadesError) {
      console.error('❌ Erro ao buscar atividades:', atividadesError.message);
      return;
    }

    if (!atividadesFamiliasData || atividadesFamiliasData.length === 0) {
      console.log('⚠️ Nenhuma atividade encontrada');
      return;
    }

    console.log(`✅ Encontradas ${atividadesFamiliasData.length} atividades:`);
    
    let totalFamilias = 0;
    atividadesFamiliasData.forEach((atividade, index) => {
      const quantidade = parseInt(atividade.quantidade) || 0;
      totalFamilias += quantidade;
      console.log(`   ${index + 1}. Regional: ${atividade.regional} | Quantidade: ${quantidade} | Data: ${atividade.activity_date}`);
    });

    console.log(`\n📊 RESULTADO DO CÁLCULO:`);
    console.log(`   🎯 Total de famílias embarcadas: ${totalFamilias}`);
    console.log(`   ✅ Valor esperado: 2.020`);
    console.log(`   ${totalFamilias === 2020 ? '✅ CORRETO!' : '❌ INCORRETO!'}`);

    // Testar também o endpoint HTTP se o servidor estiver rodando
    console.log('\n🌐 2. Testando endpoint HTTP (se disponível)...\n');
    
    try {
      const response = await fetch('http://localhost:3001/api/instituicoes/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Nota: Em produção seria necessário um token válido
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Resposta do endpoint HTTP:');
        console.log(`   Total de instituições: ${data.data?.total || 'N/A'}`);
        console.log(`   Famílias embarcadas: ${data.data?.resumo?.familiasEmbarcadas || 'N/A'}`);
        
        const familiasFromAPI = data.data?.resumo?.familiasEmbarcadas;
        if (familiasFromAPI === 2020) {
          console.log('   ✅ API retorna o valor correto: 2.020 famílias!');
        } else {
          console.log(`   ❌ API retorna valor incorreto: ${familiasFromAPI} (esperado: 2.020)`);
        }
      } else {
        console.log(`⚠️ Endpoint HTTP não disponível (Status: ${response.status})`);
        console.log('   Isso é normal se o servidor não estiver rodando ou se não houver autenticação');
      }
    } catch (fetchError) {
      console.log('⚠️ Não foi possível testar o endpoint HTTP');
      console.log('   Isso é normal se o servidor não estiver rodando');
    }

    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('📋 RESUMO DO TESTE:');
    console.log(`   📊 Cálculo direto no banco: ${totalFamilias} famílias`);
    console.log(`   🎯 Valor esperado: 2.020 famílias`);
    console.log(`   ${totalFamilias === 2020 ? '✅ TESTE PASSOU!' : '❌ TESTE FALHOU!'}`);

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

testarEndpointStats();