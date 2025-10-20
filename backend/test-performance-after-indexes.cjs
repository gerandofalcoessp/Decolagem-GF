const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPerformance() {
  console.log('🚀 Testando Performance Após Aplicação dos Índices Otimizados\n');
  console.log('=' .repeat(60));

  const tests = [
    {
      name: 'Verificar Índices Criados',
      description: 'Confirma se os índices foram aplicados corretamente',
      query: `
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND (
            indexname LIKE 'idx_regional_activities_%' OR
            indexname LIKE 'idx_goals_%' OR
            indexname LIKE 'idx_usuarios_%' OR
            indexname LIKE 'idx_members_%'
          )
        ORDER BY tablename, indexname;
      `
    },
    {
      name: 'Query Regional Activities por Member',
      description: 'Busca atividades regionais por membro (deve usar idx_regional_activities_member_id)',
      query: `
        EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT * FROM regional_activities 
        WHERE member_id IS NOT NULL 
        ORDER BY created_at DESC 
        LIMIT 10;
      `
    },
    {
      name: 'Query Goals por Member e Status',
      description: 'Busca metas por membro e status (deve usar idx_goals_member_status)',
      query: `
        EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT * FROM goals 
        WHERE member_id IS NOT NULL 
          AND status IS NOT NULL 
        ORDER BY created_at DESC 
        LIMIT 10;
      `
    },
    {
      name: 'Query Usuarios por Regional',
      description: 'Busca usuários por regional (deve usar idx_usuarios_regional)',
      query: `
        EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT * FROM usuarios 
        WHERE regional IS NOT NULL 
        ORDER BY created_at DESC 
        LIMIT 10;
      `
    },
    {
      name: 'Query Members por Auth User',
      description: 'Busca membros por auth_user_id (deve usar idx_members_auth_user_id)',
      query: `
        EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT * FROM members 
        WHERE auth_user_id IS NOT NULL 
        ORDER BY created_at DESC 
        LIMIT 10;
      `
    },
    {
      name: 'Query JOIN Otimizada',
      description: 'JOIN entre members e regional_activities (deve usar múltiplos índices)',
      query: `
        EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT 
          m.name,
          m.email,
          m.regional,
          COUNT(ra.id) as atividades_count
        FROM members m
        LEFT JOIN regional_activities ra ON m.id = ra.member_id
        WHERE m.regional IS NOT NULL
        GROUP BY m.id, m.name, m.email, m.regional
        ORDER BY atividades_count DESC
        LIMIT 10;
      `
    }
  ];

  for (const test of tests) {
    console.log(`\n📊 ${test.name}`);
    console.log(`📝 ${test.description}`);
    console.log('-'.repeat(50));

    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: test.query 
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      if (error) {
        console.log(`❌ Erro: ${error.message}`);
        
        // Tentar query alternativa para verificação de índices
        if (test.name === 'Verificar Índices Criados') {
          console.log('🔄 Tentando método alternativo...');
          
          const alternativeQuery = `
            SELECT 
              t.relname as table_name,
              i.relname as index_name,
              pg_get_indexdef(i.oid) as index_definition
            FROM pg_class t, pg_class i, pg_index ix
            WHERE t.oid = ix.indrelid
              AND i.oid = ix.indexrelid
              AND t.relkind = 'r'
              AND t.relname IN ('regional_activities', 'goals', 'usuarios', 'members')
              AND i.relname LIKE 'idx_%'
            ORDER BY t.relname, i.relname;
          `;
          
          const { data: altData, error: altError } = await supabase.rpc('exec_sql', { 
            sql_query: alternativeQuery 
          });
          
          if (!altError && altData) {
            console.log('✅ Índices encontrados:');
            altData.forEach(idx => {
              console.log(`  📋 ${idx.table_name}.${idx.index_name}`);
            });
          }
        }
      } else {
        console.log(`⏱️  Tempo de execução: ${executionTime}ms`);
        
        if (test.name === 'Verificar Índices Criados' && data) {
          console.log('✅ Índices criados com sucesso:');
          data.forEach(idx => {
            console.log(`  📋 ${idx.tablename}.${idx.indexname}`);
          });
        } else if (data && Array.isArray(data) && data.length > 0 && data[0].QUERY_PLAN) {
          // Análise do plano de execução
          const plan = data[0].QUERY_PLAN[0];
          console.log(`📈 Plano de Execução:`);
          console.log(`  - Tempo total: ${plan['Actual Total Time']?.toFixed(2) || 'N/A'}ms`);
          console.log(`  - Linhas retornadas: ${plan['Actual Rows'] || 'N/A'}`);
          console.log(`  - Método: ${plan['Node Type'] || 'N/A'}`);
          
          // Verificar se índices estão sendo usados
          const planStr = JSON.stringify(plan);
          const indexUsed = planStr.includes('Index Scan') || planStr.includes('Index Only Scan');
          console.log(`  - Usando índice: ${indexUsed ? '✅ Sim' : '❌ Não'}`);
          
          if (indexUsed) {
            const indexMatch = planStr.match(/idx_[a-zA-Z_]+/g);
            if (indexMatch) {
              console.log(`  - Índices utilizados: ${indexMatch.join(', ')}`);
            }
          }
        } else if (data) {
          console.log(`✅ Query executada com sucesso - ${data.length || 0} resultados`);
        }
      }
    } catch (err) {
      console.log(`❌ Erro na execução: ${err.message}`);
    }
  }

  // Estatísticas gerais das tabelas
  console.log('\n📊 Estatísticas das Tabelas');
  console.log('=' .repeat(60));
  
  const tables = ['regional_activities', 'goals', 'usuarios', 'members'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`📋 ${table}: ${count || 0} registros`);
      }
    } catch (err) {
      console.log(`📋 ${table}: Erro ao contar registros`);
    }
  }

  console.log('\n🎯 Teste de Performance Concluído!');
  console.log('=' .repeat(60));
}

testPerformance().catch(console.error);