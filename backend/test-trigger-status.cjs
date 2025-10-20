const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTriggerStatus() {
  console.log('🔍 Verificando status dos triggers no banco de dados...\n');
  
  try {
    // 1. Verificar se as funções existem
    console.log('1️⃣ Verificando funções de sincronização...');
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_schema', 'public')
      .like('routine_name', '%sync_user%');
    
    if (funcError) {
      console.error('❌ Erro ao verificar funções:', funcError);
    } else {
      console.log('✅ Funções encontradas:', functions);
    }
    
    // 2. Verificar se os triggers existem na tabela auth.users
    console.log('\n2️⃣ Verificando triggers na tabela auth.users...');
    const { data: triggers, error: trigError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_timing, trigger_schema, event_object_table')
      .eq('event_object_schema', 'auth')
      .eq('event_object_table', 'users');
    
    if (trigError) {
      console.error('❌ Erro ao verificar triggers:', trigError);
    } else {
      console.log('✅ Triggers encontrados:', triggers);
    }
    
    // 3. Testar criação de usuário para ver se o trigger funciona
    console.log('\n3️⃣ Testando criação de usuário para verificar trigger...');
    
    const testEmail = `test-trigger-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    // Criar usuário via Supabase Auth Admin
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        nome: 'Teste Trigger',
        role: 'user',
        regional: 'Nacional',
        tipo: 'Nacional',
        funcao: 'Teste'
      }
    });
    
    if (createError) {
      console.error('❌ Erro ao criar usuário de teste:', createError);
      return;
    }
    
    console.log('✅ Usuário de teste criado no Auth:', newUser.user.id);
    
    // Aguardar um pouco para o trigger processar
    console.log('⏳ Aguardando trigger processar...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verificar se foi criado na tabela usuarios
    const { data: usuarioCreated, error: checkError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', newUser.user.id)
      .single();
    
    if (checkError) {
      console.error('❌ Usuário NÃO foi criado automaticamente na tabela usuarios:', checkError);
      console.log('🔧 Isso indica que os triggers não estão funcionando');
    } else {
      console.log('✅ Usuário foi criado automaticamente na tabela usuarios:', usuarioCreated);
      console.log('🎉 Triggers estão funcionando corretamente!');
    }
    
    // Limpar usuário de teste
    console.log('\n🧹 Limpando usuário de teste...');
    
    // Remover da tabela usuarios
    await supabase
      .from('usuarios')
      .delete()
      .eq('auth_user_id', newUser.user.id);
    
    // Remover do Auth
    await supabase.auth.admin.deleteUser(newUser.user.id);
    
    console.log('✅ Usuário de teste removido');
    
  } catch (error) {
    console.error('💥 Erro durante verificação:', error);
  }
}

checkTriggerStatus();