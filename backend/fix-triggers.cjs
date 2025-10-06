const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTriggers() {
  console.log('🔧 Verificando e corrigindo triggers...\n');
  
  try {
    // Verificar se os triggers estão na tabela auth.users
    console.log('1️⃣ Verificando triggers na tabela auth.users...');
    const { data: authTriggers, error: authTrigError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            t.tgname as trigger_name,
            t.tgenabled as enabled,
            c.relname as table_name,
            n.nspname as schema_name,
            p.proname as function_name
          FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          JOIN pg_namespace n ON c.relnamespace = n.oid
          JOIN pg_proc p ON t.tgfoid = p.oid
          WHERE c.relname = 'users' AND n.nspname = 'auth'
          ORDER BY t.tgname;
        `
      });
    
    if (authTrigError) {
      console.error('❌ Erro ao verificar triggers auth:', authTrigError);
    } else {
      console.log('✅ Triggers na tabela auth.users:', authTriggers);
    }
    
    // Criar triggers na tabela auth.users se não existirem
    console.log('\n2️⃣ Criando triggers na tabela auth.users...');
    const { data: createResult, error: createError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          -- Remover triggers existentes se houver
          DROP TRIGGER IF EXISTS trigger_sync_usuarios_on_auth_create ON auth.users;
          DROP TRIGGER IF EXISTS trigger_sync_usuarios_on_auth_update ON auth.users;
          DROP TRIGGER IF EXISTS trigger_sync_usuarios_on_auth_delete ON auth.users;
          
          -- Criar triggers na tabela auth.users
          CREATE TRIGGER trigger_sync_usuarios_on_auth_create
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION sync_user_on_auth_create();
          
          CREATE TRIGGER trigger_sync_usuarios_on_auth_update
            AFTER UPDATE ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION sync_user_on_auth_update();
          
          CREATE TRIGGER trigger_sync_usuarios_on_auth_delete
            AFTER DELETE ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION sync_user_on_auth_delete();
        `
      });
    
    if (createError) {
      console.error('❌ Erro ao criar triggers:', createError);
    } else {
      console.log('✅ Triggers criados na tabela auth.users:', createResult);
    }
    
    // Verificar novamente se os triggers foram criados
    console.log('\n3️⃣ Verificando triggers criados...');
    const { data: finalCheck, error: finalError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            t.tgname as trigger_name,
            t.tgenabled as enabled,
            c.relname as table_name,
            n.nspname as schema_name,
            p.proname as function_name
          FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          JOIN pg_namespace n ON c.relnamespace = n.oid
          JOIN pg_proc p ON t.tgfoid = p.oid
          WHERE c.relname = 'users' AND n.nspname = 'auth'
          ORDER BY t.tgname;
        `
      });
    
    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError);
    } else {
      console.log('✅ Triggers finais na tabela auth.users:', finalCheck);
    }
    
    console.log('\n🎉 Correção de triggers concluída!');
    
  } catch (err) {
    console.error('💥 Erro geral:', err);
  }
}

fixTriggers();