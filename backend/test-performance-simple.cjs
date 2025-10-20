const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function measureQueryTime(queryFunction, description) {
  console.log(`\n📊 ${description}`);
  console.log('-'.repeat(50));
  
  const startTime = Date.now();
  
  try {
    const result = await queryFunction();
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    if (result.error) {
      console.log(`❌ Erro: ${result.error.message}`);
      return { success: false, time: executionTime, error: result.error.message };
    } else {
      console.log(`✅ Sucesso - ${result.data?.length || result.count || 0} resultados`);
      console.log(`⏱️  Tempo de execução: ${executionTime}ms`);
      return { success: true, time: executionTime, results: result.data?.length || result.count || 0 };
    }
  } catch (err) {
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    console.log(`❌ Erro na execução: ${err.message}`);
    return { success: false, time: executionTime, error: err.message };
  }
}

async function testPerformance() {
  console.log('🚀 Análise de Performance Após Índices Otimizados\n');
  console.log('=' .repeat(60));

  const results = [];

  // Teste 1: Query em regional_activities por member_id
  const test1 = await measureQueryTime(
    () => supabase
      .from('regional_activities')
      .select('*')
      .not('member_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10),
    'Regional Activities por Member ID (índice: idx_regional_activities_member_id)'
  );
  results.push({ test: 'Regional Activities por Member', ...test1 });

  // Teste 2: Query em goals por member_id e status
  const test2 = await measureQueryTime(
    () => supabase
      .from('goals')
      .select('*')
      .not('member_id', 'is', null)
      .not('status', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10),
    'Goals por Member ID e Status (índice: idx_goals_member_status)'
  );
  results.push({ test: 'Goals por Member e Status', ...test2 });

  // Teste 3: Query em usuarios por regional
  const test3 = await measureQueryTime(
    () => supabase
      .from('usuarios')
      .select('*')
      .not('regional', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10),
    'Usuarios por Regional (índice: idx_usuarios_regional)'
  );
  results.push({ test: 'Usuarios por Regional', ...test3 });

  // Teste 4: Query em members por auth_user_id
  const test4 = await measureQueryTime(
    () => supabase
      .from('members')
      .select('*')
      .not('auth_user_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10),
    'Members por Auth User ID (índice: idx_members_auth_user_id)'
  );
  results.push({ test: 'Members por Auth User', ...test4 });

  // Teste 5: Query em goals por created_at (ordenação)
  const test5 = await measureQueryTime(
    () => supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20),
    'Goals ordenados por Data (índice: idx_goals_created_at)'
  );
  results.push({ test: 'Goals por Data', ...test5 });

  // Teste 6: Query em usuarios por email
  const test6 = await measureQueryTime(
    () => supabase
      .from('usuarios')
      .select('*')
      .not('email', 'is', null)
      .limit(10),
    'Usuarios por Email (índice: idx_usuarios_email)'
  );
  results.push({ test: 'Usuarios por Email', ...test6 });

  // Teste 7: Contagem rápida com filtros
  const test7 = await measureQueryTime(
    () => supabase
      .from('goals')
      .select('*', { count: 'exact', head: true })
      .not('member_id', 'is', null),
    'Contagem Goals por Member (usando índice)'
  );
  results.push({ test: 'Contagem Goals', ...test7 });

  // Teste 8: Query complexa com múltiplos filtros
  const test8 = await measureQueryTime(
    () => supabase
      .from('members')
      .select('*')
      .not('auth_user_id', 'is', null)
      .not('regional', 'is', null)
      .limit(5),
    'Members com Auth User e Regional (índice composto: idx_members_auth_regional)'
  );
  results.push({ test: 'Members Filtro Composto', ...test8 });

  // Resumo dos resultados
  console.log('\n📈 RESUMO DOS RESULTADOS');
  console.log('=' .repeat(60));
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  console.log(`✅ Testes bem-sucedidos: ${successfulTests.length}/${results.length}`);
  console.log(`❌ Testes com erro: ${failedTests.length}/${results.length}`);
  
  if (successfulTests.length > 0) {
    const avgTime = successfulTests.reduce((sum, r) => sum + r.time, 0) / successfulTests.length;
    const minTime = Math.min(...successfulTests.map(r => r.time));
    const maxTime = Math.max(...successfulTests.map(r => r.time));
    
    console.log(`\n⏱️  TEMPOS DE EXECUÇÃO:`);
    console.log(`   - Tempo médio: ${avgTime.toFixed(2)}ms`);
    console.log(`   - Tempo mínimo: ${minTime}ms`);
    console.log(`   - Tempo máximo: ${maxTime}ms`);
    
    console.log(`\n🏆 MELHORES PERFORMANCES:`);
    successfulTests
      .sort((a, b) => a.time - b.time)
      .slice(0, 3)
      .forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.test}: ${result.time}ms`);
      });
  }

  if (failedTests.length > 0) {
    console.log(`\n❌ TESTES COM PROBLEMAS:`);
    failedTests.forEach(result => {
      console.log(`   - ${result.test}: ${result.error}`);
    });
  }

  // Estatísticas das tabelas
  console.log('\n📊 ESTATÍSTICAS DAS TABELAS');
  console.log('=' .repeat(60));
  
  const tables = ['regional_activities', 'goals', 'usuarios', 'members'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`📋 ${table}: ${count || 0} registros`);
      } else {
        console.log(`📋 ${table}: Erro ao contar - ${error.message}`);
      }
    } catch (err) {
      console.log(`📋 ${table}: Erro na contagem - ${err.message}`);
    }
  }

  console.log('\n🎯 ANÁLISE CONCLUÍDA!');
  console.log('=' .repeat(60));
  console.log('💡 Os índices otimizados devem melhorar significativamente:');
  console.log('   - Queries com filtros em colunas indexadas');
  console.log('   - Ordenações por colunas com índice');
  console.log('   - JOINs entre tabelas relacionadas');
  console.log('   - Contagens com filtros específicos');
}

testPerformance().catch(console.error);