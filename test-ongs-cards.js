const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOngsCards() {
  try {
    console.log('🔍 Testando os cards ONGs Decolagem e ONGs Maras...\n');

    // 1. Verificar todas as instituições por status
    console.log('📊 Verificando distribuição de instituições por status:');
    
    const { data: allInstituicoes, error: allError } = await supabase
      .from('instituicoes')
      .select('id, nome, programa, regional, status');

    if (allError) {
      console.log('❌ Erro ao buscar instituições:', allError.message);
      return;
    }

    const statusCount = {
      ativa: 0,
      inativa: 0,
      evadida: 0
    };

    const programCount = {
      decolagem: { ativa: 0, inativa: 0, evadida: 0 },
      as_maras: { ativa: 0, inativa: 0, evadida: 0 }
    };

    allInstituicoes.forEach(inst => {
      const status = inst.status || 'ativa';
      statusCount[status]++;

      if (inst.programa === 'decolagem') {
        programCount.decolagem[status]++;
      } else if (inst.programa === 'as_maras') {
        programCount.as_maras[status]++;
      }
    });

    console.log('  Total por status:');
    console.log(`    - Ativas: ${statusCount.ativa}`);
    console.log(`    - Inativas: ${statusCount.inativa}`);
    console.log(`    - Evadidas: ${statusCount.evadida}`);

    console.log('\n  ONGs Decolagem por status:');
    console.log(`    - Ativas: ${programCount.decolagem.ativa}`);
    console.log(`    - Inativas: ${programCount.decolagem.inativa}`);
    console.log(`    - Evadidas: ${programCount.decolagem.evadida}`);

    console.log('\n  ONGs Maras por status:');
    console.log(`    - Ativas: ${programCount.as_maras.ativa}`);
    console.log(`    - Inativas: ${programCount.as_maras.inativa}`);
    console.log(`    - Evadidas: ${programCount.as_maras.evadida}`);

    // 2. Testar o endpoint /stats que é usado pelos cards
    console.log('\n🔄 Testando endpoint /api/instituicoes/stats...');
    
    try {
      const response = await fetch('http://localhost:4000/api/instituicoes/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Aqui você precisaria adicionar o token de autenticação se necessário
          // 'Authorization': 'Bearer YOUR_TOKEN'
        }
      });

      if (!response.ok) {
        console.log(`❌ Erro HTTP: ${response.status} - ${response.statusText}`);
        return;
      }

      const statsData = await response.json();
      console.log('✅ Resposta do endpoint /stats:');
      console.log(JSON.stringify(statsData, null, 2));

      // 3. Verificar se os valores estão corretos
      if (statsData.data && statsData.data.resumo) {
        const { ongsDecolagem, ongsMaras } = statsData.data.resumo;
        
        console.log('\n📋 Comparação dos valores:');
        console.log(`  ONGs Decolagem no endpoint: ${ongsDecolagem}`);
        console.log(`  ONGs Decolagem ativas esperadas: ${programCount.decolagem.ativa}`);
        console.log(`  ✅ Correto: ${ongsDecolagem === programCount.decolagem.ativa ? 'SIM' : 'NÃO'}`);

        console.log(`\n  ONGs Maras no endpoint: ${ongsMaras}`);
        console.log(`  ONGs Maras ativas esperadas: ${programCount.as_maras.ativa}`);
        console.log(`  ✅ Correto: ${ongsMaras === programCount.as_maras.ativa ? 'SIM' : 'NÃO'}`);

        if (ongsDecolagem === programCount.decolagem.ativa && ongsMaras === programCount.as_maras.ativa) {
          console.log('\n🎉 SUCESSO! Os cards estão mostrando apenas ONGs ativas!');
        } else {
          console.log('\n⚠️ ATENÇÃO! Os valores não coincidem. Pode haver um problema na filtragem.');
        }
      } else {
        console.log('❌ Estrutura de resposta inesperada do endpoint');
      }

    } catch (fetchError) {
      console.log('❌ Erro ao fazer requisição para o endpoint:', fetchError.message);
      console.log('   Certifique-se de que o backend está rodando na porta 4000');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testOngsCards();