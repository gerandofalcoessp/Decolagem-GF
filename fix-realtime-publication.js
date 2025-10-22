const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixRealtimePublication() {
  console.log('🔧 Corrigindo configuração de publicação realtime...\n');

  try {
    // 1. Verificar e criar publicação se necessário
    console.log('1️⃣ Verificando/criando publicação supabase_realtime...');
    
    const createPublicationSQL = `
      -- Remover publicação existente se houver
      DROP PUBLICATION IF EXISTS supabase_realtime;
      
      -- Criar nova publicação
      CREATE PUBLICATION supabase_realtime;
    `;

    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createPublicationSQL
    });

    if (createError) {
      console.error('❌ Erro ao criar publicação:', createError.message);
      return;
    }

    console.log('✅ Publicação supabase_realtime criada/recriada');

    // 2. Adicionar tabelas necessárias à publicação
    console.log('\n2️⃣ Adicionando tabelas à publicação...');
    
    const requiredTables = ['goals', 'regional_activities', 'instituicoes'];
    
    for (const tableName of requiredTables) {
      console.log(`   Adicionando ${tableName}...`);
      
      const addTableSQL = `
        ALTER PUBLICATION supabase_realtime ADD TABLE public.${tableName};
      `;

      const { error: addError } = await supabaseAdmin.rpc('exec_sql', {
        sql: addTableSQL
      });

      if (addError) {
        console.error(`❌ Erro ao adicionar ${tableName}:`, addError.message);
      } else {
        console.log(`✅ ${tableName} adicionada à publicação`);
      }
    }

    // 3. Configurar replica identity para FULL
    console.log('\n3️⃣ Configurando replica identity...');
    
    for (const tableName of requiredTables) {
      console.log(`   Configurando ${tableName}...`);

      // Verificar se a tabela existe antes de configurar o replica identity
      const existenceSQL = `
        SELECT EXISTS (
          SELECT 1
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'
            AND c.relname = '${tableName}'
            AND c.relkind = 'r'
        ) AS exists;
      `;

      const { data: existData, error: existError } = await supabaseAdmin.rpc('exec_sql', {
        sql: existenceSQL
      });

      if (existError) {
        console.error(`❌ Erro ao verificar existência da tabela ${tableName}:`, existError.message);
        continue;
      }

      const tableExists = Array.isArray(existData) && existData.length > 0 && (existData[0].exists === true || existData[0].exists === 't');
      if (!tableExists) {
        console.warn(`⚠️ Tabela public.${tableName} não existe, ignorando configuração de replica identity`);
        continue;
      }
      
      const replicaSQL = `
        ALTER TABLE IF EXISTS public.${tableName} REPLICA IDENTITY FULL;
      `;

      const { error: replicaError } = await supabaseAdmin.rpc('exec_sql', {
        sql: replicaSQL
      });

      if (replicaError) {
        console.error(`❌ Erro ao configurar replica identity de ${tableName}:`, replicaError.message);
      } else {
        console.log(`✅ Replica identity de ${tableName} configurada para FULL`);
      }
    }

    // 4. Verificar resultado final
    console.log('\n4️⃣ Verificando configuração final...');
    
    const verifySQL = `
      SELECT 
        pt.schemaname,
        pt.tablename,
        c.relreplident
      FROM pg_publication_tables pt
      JOIN pg_class c ON c.relname = pt.tablename
      JOIN pg_namespace n ON c.relnamespace = n.oid AND n.nspname = pt.schemaname
      WHERE pt.pubname = 'supabase_realtime'
      AND pt.schemaname = 'public'
      ORDER BY pt.tablename;
    `;

    const { data: finalCheck, error: verifyError } = await supabaseAdmin.rpc('exec_sql', {
      sql: verifySQL
    });

    if (verifyError) {
      console.error('❌ Erro ao verificar configuração final:', verifyError.message);
    } else {
      console.log('✅ Configuração final:');
      if (finalCheck && finalCheck.length > 0) {
        finalCheck.forEach(table => {
          const identityMap = {
            'd': 'default (primary key)',
            'f': 'full (all columns)',
            'i': 'index',
            'n': 'nothing'
          };
          console.log(`   - ${table.schemaname}.${table.tablename} (replica: ${identityMap[table.relreplident] || table.relreplident})`);
        });
      } else {
        console.log('   Nenhuma tabela encontrada na publicação');
      }
    }

    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Teste as subscriptions novamente');
    console.log('   2. Se ainda não funcionar, verifique as políticas RLS');
    console.log('   3. Verifique se o realtime está habilitado no dashboard do Supabase');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar correção
fixRealtimePublication().catch(console.error);