const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugTriggers() {
  console.log('🔍 Debugando triggers de sincronização...\n');
  
  try {
    // Verificar se as funções existem
    console.log('1️⃣ Verificando funções criadas...');
    const { data: functions, error: funcError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            proname as function_name,
            prosrc as function_body
          FROM pg_proc 
          WHERE proname LIKE 'sync_user_%' OR proname = 'manual_sync_usuarios_with_auth'
          ORDER BY proname;
        `
      });
    
    if (funcError) {
      console.error('❌ Erro ao verificar funções:', funcError);
    } else {
      console.log('✅ Funções encontradas:', functions);
    }
    
    // Verificar se os triggers existem
    console.log('\n2️⃣ Verificando triggers criados...');
    const { data: triggers, error: trigError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            t.tgname as trigger_name,
            t.tgenabled as enabled,
            c.relname as table_name,
            p.proname as function_name
          FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          JOIN pg_proc p ON t.tgfoid = p.oid
          WHERE t.tgname LIKE '%sync_usuarios%'
          ORDER BY t.tgname;
        `
      });
    
    if (trigError) {
      console.error('❌ Erro ao verificar triggers:', trigError);
    } else {
      console.log('✅ Triggers encontrados:', triggers);
    }
    
    // Verificar se a tabela auth.users existe e tem dados
    console.log('\n3️⃣ Verificando tabela auth.users...');
    const { data: authUsers, error: authError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            id,
            email,
            raw_user_meta_data,
            created_at,
            updated_at
          FROM auth.users 
          ORDER BY created_at DESC 
          LIMIT 5;
        `
      });
    
    if (authError) {
      console.error('❌ Erro ao verificar auth.users:', authError);
    } else {
      console.log('✅ Usuários em auth.users:', authUsers);
    }
    
    // Verificar se a tabela usuarios existe e tem dados
    console.log('\n4️⃣ Verificando tabela usuarios...');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (usuariosError) {
      console.error('❌ Erro ao verificar usuarios:', usuariosError);
    } else {
      console.log('✅ Usuários em usuarios:', usuarios);
    }
    
    // Testar execução manual da função de sincronização
    console.log('\n5️⃣ Testando sincronização manual...');
    const { data: syncResult, error: syncError } = await supabase
      .rpc('manual_sync_usuarios_with_auth');
    
    if (syncError) {
      console.error('❌ Erro na sincronização manual:', syncError);
    } else {
      console.log('✅ Resultado da sincronização manual:', syncResult);
    }
    
    console.log('\n🎉 Debug concluído!');
    
  } catch (err) {
    console.error('💥 Erro geral no debug:', err);
  }
}

debugTriggers();