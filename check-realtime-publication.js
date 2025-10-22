const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRealtimePublication() {
  console.log('🔍 Verificando configuração de publicação realtime...\n');

  try {
    // 1. Verificar se a publicação supabase_realtime existe
    console.log('1️⃣ Verificando publicação supabase_realtime...');
    const { data: publications, error: pubError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT pubname, puballtables 
        FROM pg_publication 
        WHERE pubname = 'supabase_realtime';
      `
    });

    if (pubError) {
      console.error('❌ Erro ao verificar publicação:', pubError.message);
      return;
    }

    if (!publications || publications.length === 0) {
      console.log('❌ Publicação supabase_realtime não encontrada!');
      console.log('   Execute: CREATE PUBLICATION supabase_realtime;');
      return;
    }

    console.log('✅ Publicação supabase_realtime encontrada:', publications[0]);

    // 2. Verificar quais tabelas estão na publicação
    console.log('\n2️⃣ Verificando tabelas na publicação...');
    const { data: pubTables, error: tablesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime'
        ORDER BY schemaname, tablename;
      `
    });

    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError.message);
      return;
    }

    console.log(`✅ Tabelas na publicação (${pubTables?.length || 0}):`);
    if (pubTables && pubTables.length > 0) {
      pubTables.forEach(table => {
        console.log(`   - ${table.schemaname}.${table.tablename}`);
      });
    } else {
      console.log('   Nenhuma tabela encontrada na publicação');
    }

    // 3. Verificar especificamente as tabelas que precisamos
    const requiredTables = ['goals', 'regional_activities'];
    console.log('\n3️⃣ Verificando tabelas necessárias...');
    
    for (const tableName of requiredTables) {
      const isInPublication = pubTables?.some(t => 
        t.schemaname === 'public' && t.tablename === tableName
      );
      
      if (isInPublication) {
        console.log(`✅ ${tableName} está na publicação`);
      } else {
        console.log(`❌ ${tableName} NÃO está na publicação`);
        console.log(`   Execute: ALTER PUBLICATION supabase_realtime ADD TABLE public.${tableName};`);
      }
    }

    // 4. Verificar configuração de replica identity
    console.log('\n4️⃣ Verificando replica identity das tabelas...');
    for (const tableName of requiredTables) {
      const { data: replicaInfo, error: replicaError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            relreplident
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = 'public' 
          AND c.relname = '${tableName}';
        `
      });

      if (replicaError) {
        console.error(`❌ Erro ao verificar replica identity de ${tableName}:`, replicaError.message);
      } else if (replicaInfo && replicaInfo.length > 0) {
        const identity = replicaInfo[0].relreplident;
        const identityMap = {
          'd': 'default (primary key)',
          'f': 'full (all columns)',
          'i': 'index',
          'n': 'nothing'
        };
        console.log(`   ${tableName}: ${identityMap[identity] || identity}`);
        
        if (identity === 'n') {
          console.log(`   ⚠️  ${tableName} tem replica identity 'nothing' - pode causar problemas`);
          console.log(`   Execute: ALTER TABLE public.${tableName} REPLICA IDENTITY FULL;`);
        }
      }
    }

    // 5. Verificar se o realtime está habilitado no projeto
    console.log('\n5️⃣ Verificando configuração do realtime...');
    console.log('   Para verificar se o realtime está habilitado:');
    console.log('   1. Acesse o dashboard do Supabase');
    console.log('   2. Vá em Database > Replication');
    console.log('   3. Verifique se as tabelas goals e regional_activities estão habilitadas');

    // 6. Sugestões de correção
    console.log('\n📋 RESUMO E SUGESTÕES:');
    
    const missingTables = requiredTables.filter(tableName => 
      !pubTables?.some(t => t.schemaname === 'public' && t.tablename === tableName)
    );

    if (missingTables.length > 0) {
      console.log('\n❌ PROBLEMA ENCONTRADO: Tabelas não estão na publicação realtime');
      console.log('\n🔧 SOLUÇÃO: Execute os seguintes comandos SQL:');
      missingTables.forEach(tableName => {
        console.log(`   ALTER PUBLICATION supabase_realtime ADD TABLE public.${tableName};`);
      });
    } else {
      console.log('\n✅ Todas as tabelas necessárias estão na publicação');
      console.log('\n🔍 Se as subscriptions ainda não funcionam, verifique:');
      console.log('   1. Políticas RLS (podem bloquear subscriptions)');
      console.log('   2. Configuração do realtime no dashboard');
      console.log('   3. Versão do cliente Supabase');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar verificação
checkRealtimePublication().catch(console.error);