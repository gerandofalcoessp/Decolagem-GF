const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyIndexes() {
  console.log('🔍 Verificação dos Índices Otimizados\n');
  console.log('=' .repeat(60));

  // Lista dos índices que deveriam ter sido criados
  const expectedIndexes = [
    // Regional Activities
    'idx_regional_activities_member_id',
    'idx_regional_activities_responsavel_id', 
    'idx_regional_activities_created_at',
    'idx_regional_activities_member_created',
    'idx_regional_activities_regional_status',
    
    // Goals
    'idx_goals_member_id',
    'idx_goals_status',
    'idx_goals_member_status',
    'idx_goals_created_at',
    
    // Usuarios
    'idx_usuarios_auth_user_id',
    'idx_usuarios_email',
    'idx_usuarios_status',
    'idx_usuarios_regional',
    
    // Members
    'idx_members_auth_user_id',
    'idx_members_email',
    'idx_members_regional',
    'idx_members_auth_regional'
  ];

  console.log('📋 Índices Esperados:');
  expectedIndexes.forEach((idx, i) => {
    console.log(`   ${i + 1}. ${idx}`);
  });

  console.log('\n🔍 Verificando índices existentes...\n');

  // Método 1: Tentar buscar índices diretamente das tabelas
  const tables = ['regional_activities', 'goals', 'usuarios', 'members'];
  const foundIndexes = [];

  for (const table of tables) {
    console.log(`📊 Verificando tabela: ${table}`);
    console.log('-'.repeat(40));
    
    try {
      // Tentar uma query simples para verificar se a tabela existe e tem dados
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ Erro ao acessar tabela: ${error.message}`);
      } else {
        console.log(`   ✅ Tabela acessível - ${count || 0} registros`);
        
        // Verificar se queries com filtros funcionam (indicativo de índices)
        if (table === 'goals' && count > 0) {
          const startTime = Date.now();
          const { data: filteredData, error: filterError } = await supabase
            .from(table)
            .select('*')
            .not('member_id', 'is', null)
            .limit(1);
          const endTime = Date.now();
          
          if (!filterError) {
            console.log(`   🚀 Query com filtro member_id: ${endTime - startTime}ms`);
          }
        }
        
        if (table === 'members' && count > 0) {
          const startTime = Date.now();
          const { data: filteredData, error: filterError } = await supabase
            .from(table)
            .select('*')
            .not('auth_user_id', 'is', null)
            .limit(1);
          const endTime = Date.now();
          
          if (!filterError) {
            console.log(`   🚀 Query com filtro auth_user_id: ${endTime - startTime}ms`);
          }
        }
        
        if (table === 'usuarios' && count > 0) {
          const startTime = Date.now();
          const { data: filteredData, error: filterError } = await supabase
            .from(table)
            .select('*')
            .not('email', 'is', null)
            .limit(1);
          const endTime = Date.now();
          
          if (!filterError) {
            console.log(`   🚀 Query com filtro email: ${endTime - startTime}ms`);
          }
        }
      }
    } catch (err) {
      console.log(`   ❌ Erro na verificação: ${err.message}`);
    }
    
    console.log('');
  }

  // Método 2: Verificar através de queries de performance
  console.log('⚡ Teste de Performance dos Índices');
  console.log('=' .repeat(60));

  const performanceTests = [
    {
      name: 'Goals por Member ID',
      table: 'goals',
      expectedIndex: 'idx_goals_member_id',
      query: () => supabase.from('goals').select('*').not('member_id', 'is', null).limit(5)
    },
    {
      name: 'Members por Auth User ID', 
      table: 'members',
      expectedIndex: 'idx_members_auth_user_id',
      query: () => supabase.from('members').select('*').not('auth_user_id', 'is', null).limit(5)
    },
    {
      name: 'Usuarios por Email',
      table: 'usuarios', 
      expectedIndex: 'idx_usuarios_email',
      query: () => supabase.from('usuarios').select('*').not('email', 'is', null).limit(5)
    },
    {
      name: 'Goals ordenados por Data',
      table: 'goals',
      expectedIndex: 'idx_goals_created_at', 
      query: () => supabase.from('goals').select('*').order('created_at', { ascending: false }).limit(5)
    }
  ];

  const results = [];
  
  for (const test of performanceTests) {
    console.log(`\n🧪 ${test.name}`);
    console.log(`   Índice esperado: ${test.expectedIndex}`);
    
    const startTime = Date.now();
    
    try {
      const { data, error } = await test.query();
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      if (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        results.push({ test: test.name, success: false, time: executionTime, error: error.message });
      } else {
        console.log(`   ✅ Sucesso - ${data?.length || 0} resultados em ${executionTime}ms`);
        results.push({ test: test.name, success: true, time: executionTime, results: data?.length || 0 });
        
        // Tempos muito rápidos (< 100ms) podem indicar uso eficiente de índices
        if (executionTime < 100) {
          console.log(`   🚀 Performance excelente - provável uso de índice!`);
        }
      }
    } catch (err) {
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      console.log(`   ❌ Erro na execução: ${err.message}`);
      results.push({ test: test.name, success: false, time: executionTime, error: err.message });
    }
  }

  // Resumo final
  console.log('\n📊 RESUMO DA VERIFICAÇÃO');
  console.log('=' .repeat(60));
  
  const successfulTests = results.filter(r => r.success);
  const fastTests = successfulTests.filter(r => r.time < 100);
  
  console.log(`✅ Testes bem-sucedidos: ${successfulTests.length}/${results.length}`);
  console.log(`🚀 Testes com performance rápida (< 100ms): ${fastTests.length}/${successfulTests.length}`);
  
  if (successfulTests.length > 0) {
    const avgTime = successfulTests.reduce((sum, r) => sum + r.time, 0) / successfulTests.length;
    console.log(`⏱️  Tempo médio de execução: ${avgTime.toFixed(2)}ms`);
  }

  console.log('\n💡 INDICADORES DE ÍNDICES FUNCIONANDO:');
  console.log('   - Queries com filtros executando em < 100ms');
  console.log('   - Ordenações rápidas por colunas indexadas');
  console.log('   - Contagens eficientes com filtros');
  console.log('   - JOINs otimizados entre tabelas relacionadas');

  if (fastTests.length >= successfulTests.length * 0.7) {
    console.log('\n🎉 CONCLUSÃO: Os índices parecem estar funcionando corretamente!');
    console.log('   A maioria das queries está executando com boa performance.');
  } else if (fastTests.length > 0) {
    console.log('\n⚠️  CONCLUSÃO: Alguns índices podem estar funcionando.');
    console.log('   Algumas queries mostram boa performance, outras podem precisar de otimização.');
  } else {
    console.log('\n❌ CONCLUSÃO: Os índices podem não estar sendo utilizados eficientemente.');
    console.log('   Considere verificar se foram criados corretamente no Supabase Dashboard.');
  }

  console.log('\n🔍 Para verificação manual no Supabase Dashboard:');
  console.log('   1. Acesse o SQL Editor');
  console.log('   2. Execute: SELECT * FROM pg_indexes WHERE schemaname = \'public\' AND indexname LIKE \'idx_%\';');
  console.log('   3. Verifique se os índices listados acima estão presentes');
}

verifyIndexes().catch(console.error);