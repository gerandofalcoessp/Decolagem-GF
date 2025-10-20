const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runBenchmark(queryFunction, description, iterations = 5) {
  console.log(`\n🔄 ${description}`);
  console.log(`   Executando ${iterations} vezes para obter média precisa...`);
  console.log('-'.repeat(50));
  
  const times = [];
  let successCount = 0;
  let totalResults = 0;
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const result = await queryFunction();
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      if (result.error) {
        console.log(`   ❌ Iteração ${i + 1}: Erro - ${result.error.message}`);
      } else {
        times.push(executionTime);
        successCount++;
        totalResults = result.data?.length || result.count || 0;
        console.log(`   ✅ Iteração ${i + 1}: ${executionTime}ms`);
      }
    } catch (err) {
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      console.log(`   ❌ Iteração ${i + 1}: Erro - ${err.message}`);
    }
    
    // Pequena pausa entre iterações para evitar sobrecarga
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const medianTime = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
    
    console.log(`\n   📊 ESTATÍSTICAS:`);
    console.log(`      - Sucessos: ${successCount}/${iterations}`);
    console.log(`      - Resultados: ${totalResults}`);
    console.log(`      - Tempo médio: ${avgTime.toFixed(2)}ms`);
    console.log(`      - Tempo mediano: ${medianTime}ms`);
    console.log(`      - Tempo mínimo: ${minTime}ms`);
    console.log(`      - Tempo máximo: ${maxTime}ms`);
    console.log(`      - Variação: ${(maxTime - minTime)}ms`);
    
    return {
      success: true,
      avgTime,
      medianTime,
      minTime,
      maxTime,
      successRate: successCount / iterations,
      results: totalResults,
      times
    };
  } else {
    console.log(`   ❌ Nenhuma execução bem-sucedida`);
    return { success: false };
  }
}

async function benchmarkComparison() {
  console.log('⚡ BENCHMARK DE PERFORMANCE COM ÍNDICES OTIMIZADOS\n');
  console.log('=' .repeat(70));
  console.log('🎯 Objetivo: Medir performance das queries mais importantes');
  console.log('📊 Método: Múltiplas execuções para obter estatísticas precisas');
  console.log('=' .repeat(70));

  const benchmarks = [];

  // Benchmark 1: Goals por Member ID (índice simples)
  const bench1 = await runBenchmark(
    () => supabase
      .from('goals')
      .select('*')
      .not('member_id', 'is', null)
      .limit(10),
    'Goals filtrados por Member ID (idx_goals_member_id)',
    5
  );
  benchmarks.push({ name: 'Goals por Member ID', ...bench1 });

  // Benchmark 2: Goals com ordenação por data (índice de ordenação)
  const bench2 = await runBenchmark(
    () => supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
    'Goals ordenados por Data (idx_goals_created_at)',
    5
  );
  benchmarks.push({ name: 'Goals ordenados por Data', ...bench2 });

  // Benchmark 3: Members por Auth User ID (índice simples)
  const bench3 = await runBenchmark(
    () => supabase
      .from('members')
      .select('*')
      .not('auth_user_id', 'is', null)
      .limit(10),
    'Members por Auth User ID (idx_members_auth_user_id)',
    5
  );
  benchmarks.push({ name: 'Members por Auth User', ...bench3 });

  // Benchmark 4: Usuarios por Email (índice simples)
  const bench4 = await runBenchmark(
    () => supabase
      .from('usuarios')
      .select('*')
      .not('email', 'is', null)
      .limit(10),
    'Usuarios por Email (idx_usuarios_email)',
    5
  );
  benchmarks.push({ name: 'Usuarios por Email', ...bench4 });

  // Benchmark 5: Goals com filtro composto (member_id + status)
  const bench5 = await runBenchmark(
    () => supabase
      .from('goals')
      .select('*')
      .not('member_id', 'is', null)
      .not('status', 'is', null)
      .limit(5),
    'Goals com Filtro Composto (idx_goals_member_status)',
    5
  );
  benchmarks.push({ name: 'Goals Filtro Composto', ...bench5 });

  // Benchmark 6: Members com filtro composto (auth_user_id + regional)
  const bench6 = await runBenchmark(
    () => supabase
      .from('members')
      .select('*')
      .not('auth_user_id', 'is', null)
      .not('regional', 'is', null)
      .limit(5),
    'Members com Filtro Composto (idx_members_auth_regional)',
    5
  );
  benchmarks.push({ name: 'Members Filtro Composto', ...bench6 });

  // Benchmark 7: Contagem otimizada
  const bench7 = await runBenchmark(
    () => supabase
      .from('goals')
      .select('*', { count: 'exact', head: true })
      .not('member_id', 'is', null),
    'Contagem Goals por Member (usando índice)',
    3
  );
  benchmarks.push({ name: 'Contagem Goals', ...bench7 });

  // Análise dos resultados
  console.log('\n🏆 ANÁLISE COMPARATIVA DOS RESULTADOS');
  console.log('=' .repeat(70));

  const successfulBenchmarks = benchmarks.filter(b => b.success);
  
  if (successfulBenchmarks.length === 0) {
    console.log('❌ Nenhum benchmark foi executado com sucesso');
    return;
  }

  // Ranking por performance média
  console.log('\n🥇 RANKING POR PERFORMANCE MÉDIA:');
  successfulBenchmarks
    .sort((a, b) => a.avgTime - b.avgTime)
    .forEach((bench, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊';
      console.log(`   ${medal} ${bench.name}: ${bench.avgTime.toFixed(2)}ms (mediana: ${bench.medianTime}ms)`);
    });

  // Análise de consistência
  console.log('\n📈 ANÁLISE DE CONSISTÊNCIA:');
  successfulBenchmarks.forEach(bench => {
    const variation = bench.maxTime - bench.minTime;
    const variationPercent = (variation / bench.avgTime) * 100;
    const consistency = variationPercent < 20 ? '🟢 Excelente' : 
                       variationPercent < 50 ? '🟡 Boa' : '🔴 Instável';
    
    console.log(`   ${bench.name}:`);
    console.log(`      - Variação: ${variation}ms (${variationPercent.toFixed(1)}%) - ${consistency}`);
    console.log(`      - Taxa de sucesso: ${(bench.successRate * 100).toFixed(1)}%`);
  });

  // Estatísticas gerais
  const allTimes = successfulBenchmarks.flatMap(b => b.times);
  const overallAvg = allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length;
  const fastQueries = allTimes.filter(time => time < 100).length;
  const slowQueries = allTimes.filter(time => time > 200).length;

  console.log('\n📊 ESTATÍSTICAS GERAIS:');
  console.log(`   - Tempo médio geral: ${overallAvg.toFixed(2)}ms`);
  console.log(`   - Queries rápidas (< 100ms): ${fastQueries}/${allTimes.length} (${(fastQueries/allTimes.length*100).toFixed(1)}%)`);
  console.log(`   - Queries lentas (> 200ms): ${slowQueries}/${allTimes.length} (${(slowQueries/allTimes.length*100).toFixed(1)}%)`);

  // Avaliação da eficácia dos índices
  console.log('\n🎯 AVALIAÇÃO DA EFICÁCIA DOS ÍNDICES:');
  
  if (overallAvg < 100) {
    console.log('   🟢 EXCELENTE: Performance média muito boa, índices funcionando eficientemente');
  } else if (overallAvg < 150) {
    console.log('   🟡 BOA: Performance adequada, índices proporcionando benefícios');
  } else {
    console.log('   🔴 ATENÇÃO: Performance pode ser melhorada, verificar índices');
  }

  const fastQueryPercent = (fastQueries / allTimes.length) * 100;
  if (fastQueryPercent > 70) {
    console.log('   🚀 Maioria das queries executando rapidamente');
  } else if (fastQueryPercent > 40) {
    console.log('   ⚡ Boa parte das queries com performance adequada');
  } else {
    console.log('   ⚠️  Muitas queries podem se beneficiar de otimização adicional');
  }

  // Recomendações
  console.log('\n💡 RECOMENDAÇÕES:');
  console.log('   1. Queries com variação alta podem se beneficiar de índices adicionais');
  console.log('   2. Monitore queries que consistentemente excedem 200ms');
  console.log('   3. Considere índices compostos para filtros múltiplos frequentes');
  console.log('   4. Verifique se todos os índices foram criados corretamente no Supabase');

  console.log('\n✅ BENCHMARK CONCLUÍDO!');
  console.log('=' .repeat(70));
}

benchmarkComparison().catch(console.error);