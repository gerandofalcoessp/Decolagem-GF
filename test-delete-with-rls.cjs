const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

// Cliente admin (bypassa RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Cliente normal (sujeito a RLS)
const supabaseUser = createClient(supabaseUrl, supabaseAnonKey);

async function testDeleteWithRLS() {
  const activityId = '53f5180a-e52b-4abd-baf9-927e6b405e28';
  
  console.log('🧪 Testando exclusão com RLS policies...\n');
  
  // 1. Verificar se a atividade existe
  console.log('1️⃣ Verificando se a atividade existe...');
  const { data: activity, error: fetchError } = await supabaseAdmin
    .from('regional_activities')
    .select('*')
    .eq('id', activityId)
    .single();
  
  if (fetchError || !activity) {
    console.log('❌ Atividade não encontrada:', fetchError?.message);
    return;
  }
  
  console.log('✅ Atividade encontrada:', {
    id: activity.id,
    title: activity.title,
    member_id: activity.member_id,
    regional: activity.regional
  });
  
  // 2. Testar exclusão com cliente admin (deve funcionar)
  console.log('\n2️⃣ Testando exclusão com cliente ADMIN (bypassa RLS)...');
  const { data: adminDeleteData, error: adminDeleteError } = await supabaseAdmin
    .from('regional_activities')
    .delete()
    .eq('id', activityId)
    .select('*');
  
  if (adminDeleteError) {
    console.log('❌ Erro na exclusão com admin:', adminDeleteError.message);
  } else {
    console.log('✅ Exclusão com admin bem-sucedida:', adminDeleteData);
    
    // Verificar se realmente foi deletada
    const { data: checkAfterAdmin } = await supabaseAdmin
      .from('regional_activities')
      .select('*')
      .eq('id', activityId);
    
    if (checkAfterAdmin && checkAfterAdmin.length === 0) {
      console.log('✅ Atividade foi realmente removida do banco');
    } else {
      console.log('❌ PROBLEMA: Atividade ainda existe após exclusão com admin!');
    }
  }
  
  // 3. Se a exclusão com admin não funcionou, vamos investigar RLS policies
  if (adminDeleteError) {
    console.log('\n3️⃣ Investigando RLS policies para regional_activities...');
    
    // Verificar políticas RLS
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('get_policies', { table_name: 'regional_activities' });
    
    if (policiesError) {
      console.log('❌ Erro ao buscar políticas RLS:', policiesError.message);
    } else {
      console.log('📋 Políticas RLS encontradas:', policies);
    }
    
    // Verificar se RLS está habilitado
    const { data: rlsStatus } = await supabaseAdmin
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'regional_activities');
    
    console.log('🔒 Status RLS da tabela:', rlsStatus);
  }
}

testDeleteWithRLS().catch(console.error);