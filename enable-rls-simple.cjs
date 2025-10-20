const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function enableRLS() {
  console.log('🔧 Habilitando RLS na tabela regional_activities...\n');
  
  try {
    // 1. Habilitar RLS
    console.log('1️⃣ Habilitando RLS...');
    const enableRLSSQL = 'ALTER TABLE public.regional_activities ENABLE ROW LEVEL SECURITY;';
    const { error: enableError } = await supabaseAdmin.rpc('exec_sql', { sql: enableRLSSQL });
    
    if (enableError) {
      console.log('❌ Erro ao habilitar RLS:', enableError.message);
    } else {
      console.log('✅ RLS habilitado com sucesso');
    }
    
    // 2. Verificar status
    console.log('\n2️⃣ Verificando status...');
    const checkSQL = "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'regional_activities' AND schemaname = 'public';";
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: checkSQL });
    
    if (error) {
      console.log('❌ Erro ao verificar:', error.message);
    } else {
      console.log('📊 Status atual:', data);
    }
    
    // 3. Verificar políticas existentes
    console.log('\n3️⃣ Verificando políticas existentes...');
    const policiesSQL = "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'regional_activities' AND schemaname = 'public';";
    const { data: policies, error: policiesError } = await supabaseAdmin.rpc('exec_sql', { sql: policiesSQL });
    
    if (policiesError) {
      console.log('❌ Erro ao verificar políticas:', policiesError.message);
    } else {
      console.log('🔒 Políticas encontradas:', policies.length);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    }
    
    console.log('\n✅ Verificação de RLS concluída!');
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

enableRLS().catch(console.error);