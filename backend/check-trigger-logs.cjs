const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTriggerLogs() {
  console.log('📋 Verificando logs e estrutura dos triggers...\n');
  
  try {
    // Verificar se a função tem permissões corretas
    console.log('1️⃣ Verificando permissões das funções...');
    const { data: permissions, error: permError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            p.proname as function_name,
            p.prosecdef as security_definer,
            p.proowner,
            r.rolname as owner_role
          FROM pg_proc p
          JOIN pg_roles r ON p.proowner = r.oid
          WHERE p.proname LIKE 'sync_user_%' OR p.proname = 'manual_sync_usuarios_with_auth';
        `
      });
    
    if (permError) {
      console.error('❌ Erro ao verificar permissões:', permError);
    } else {
      console.log('✅ Permissões das funções:', permissions);
    }
    
    // Verificar se a tabela usuarios tem as colunas corretas
    console.log('\n2️⃣ Verificando estrutura da tabela usuarios...');
    const { data: columns, error: colError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'usuarios' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (colError) {
      console.error('❌ Erro ao verificar colunas:', colError);
    } else {
      console.log('✅ Estrutura da tabela usuarios:', columns);
    }
    
    // Testar a função manualmente com dados de teste
    console.log('\n3️⃣ Testando função manualmente...');
    const { data: testResult, error: testError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          -- Simular inserção manual na tabela usuarios
          INSERT INTO public.usuarios (
            auth_user_id,
            email,
            nome,
            role,
            regional,
            tipo,
            funcao,
            area,
            status,
            created_at,
            updated_at
          ) VALUES (
            'test-manual-${Date.now()}',
            'test-manual@example.com',
            'Teste Manual',
            'user',
            'Nacional',
            'nacional',
            'Analista',
            'Nacional',
            'ativo',
            NOW(),
            NOW()
          )
          ON CONFLICT (auth_user_id) DO UPDATE SET
            updated_at = NOW()
          RETURNING *;
        `
      });
    
    if (testError) {
      console.error('❌ Erro no teste manual:', testError);
    } else {
      console.log('✅ Teste manual bem-sucedido:', testResult);
    }
    
    // Verificar logs do PostgreSQL (se disponível)
    console.log('\n4️⃣ Verificando configuração de logs...');
    const { data: logConfig, error: logError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            name,
            setting,
            context
          FROM pg_settings 
          WHERE name IN ('log_statement', 'log_min_messages', 'log_min_error_statement')
          ORDER BY name;
        `
      });
    
    if (logError) {
      console.error('❌ Erro ao verificar logs:', logError);
    } else {
      console.log('✅ Configuração de logs:', logConfig);
    }
    
    // Verificar se há constraints que podem estar causando problemas
    console.log('\n5️⃣ Verificando constraints da tabela usuarios...');
    const { data: constraints, error: constError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            tc.is_deferrable,
            tc.initially_deferred
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = 'usuarios' AND tc.table_schema = 'public'
          ORDER BY tc.constraint_type, tc.constraint_name;
        `
      });
    
    if (constError) {
      console.error('❌ Erro ao verificar constraints:', constError);
    } else {
      console.log('✅ Constraints da tabela usuarios:', constraints);
    }
    
    console.log('\n🎉 Verificação de logs concluída!');
    
  } catch (err) {
    console.error('💥 Erro geral:', err);
  }
}

checkTriggerLogs();