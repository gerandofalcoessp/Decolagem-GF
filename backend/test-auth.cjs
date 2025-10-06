require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testAuthentication() {
  console.log('🔐 Testando sistema de autenticação...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    process.exit(1);
  }
  
  // Cliente anônimo (para registro/login)
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  // Cliente admin (para operações administrativas)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('1. Testando configuração de autenticação...');
  
  // Verificar se auth está funcionando
  const { data: authConfig, error: authError } = await supabaseAdmin.auth.getSession();
  if (authError) {
    console.log('⚠️  Auth config:', authError.message);
  } else {
    console.log('✅ Configuração de auth OK');
  }
  
  console.log('\n2. Testando criação de usuário de teste...');
  
  // Criar usuário de teste
  const testEmail = `teste-${Date.now()}@decolagem.com`;
  const testPassword = 'TesteSeguro123!';
  
  const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        name: 'Usuário Teste',
        role: 'user'
      }
    }
  });
  
  if (signUpError) {
    console.error('❌ Erro no registro:', signUpError.message);
  } else {
    console.log('✅ Usuário criado:', signUpData.user?.email);
    console.log('📧 Confirmação necessária:', !signUpData.user?.email_confirmed_at);
  }
  
  console.log('\n3. Testando login...');
  
  const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });
  
  if (signInError) {
    console.error('❌ Erro no login:', signInError.message);
  } else {
    console.log('✅ Login realizado:', signInData.user?.email);
    console.log('🔑 Token gerado:', !!signInData.session?.access_token);
  }
  
  console.log('\n4. Testando acesso a dados protegidos...');
  
  // Testar acesso à tabela usuarios
  const { data: usuariosData, error: usuariosError } = await supabaseAnon
    .from('usuarios')
    .select('*')
    .limit(5);
  
  if (usuariosError) {
    console.log('⚠️  Acesso a usuarios:', usuariosError.message);
  } else {
    console.log('✅ Acesso a usuarios:', usuariosData?.length || 0, 'registros');
  }
  
  // Testar acesso à tabela members
  const { data: membersData, error: membersError } = await supabaseAnon
    .from('members')
    .select('*')
    .limit(5);
  
  if (membersError) {
    console.log('⚠️  Acesso a members:', membersError.message);
  } else {
    console.log('✅ Acesso a members:', membersData?.length || 0, 'registros');
  }
  
  // Testar acesso à tabela goals
  const { data: goalsData, error: goalsError } = await supabaseAnon
    .from('goals')
    .select('*')
    .limit(5);
  
  if (goalsError) {
    console.log('⚠️  Acesso a goals:', goalsError.message);
  } else {
    console.log('✅ Acesso a goals:', goalsData?.length || 0, 'registros');
  }
  
  console.log('\n5. Testando operações CRUD básicas...');
  
  if (signInData.session) {
    // Configurar cliente autenticado
    supabaseAnon.auth.setSession(signInData.session);
    
    // Tentar inserir um registro na tabela usuarios
    const { data: insertData, error: insertError } = await supabaseAnon
      .from('usuarios')
      .insert({
        name: 'Teste CRUD',
        email: `crud-${Date.now()}@teste.com`,
        role: 'user',
        auth_user_id: signInData.user.id
      })
      .select();
    
    if (insertError) {
      console.log('⚠️  Insert usuarios:', insertError.message);
    } else {
      console.log('✅ Insert usuarios:', insertData?.length || 0, 'registro criado');
    }
  }
  
  console.log('\n6. Limpeza - removendo usuário de teste...');
  
  // Remover usuário de teste (apenas com admin)
  if (signUpData.user?.id) {
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
    
    if (deleteError) {
      console.log('⚠️  Erro ao remover usuário:', deleteError.message);
    } else {
      console.log('✅ Usuário de teste removido');
    }
  }
  
  console.log('\n📊 Resumo do teste de autenticação:');
  console.log('- Configuração:', authError ? '❌' : '✅');
  console.log('- Registro:', signUpError ? '❌' : '✅');
  console.log('- Login:', signInError ? '❌' : '✅');
  console.log('- Acesso a dados:', (usuariosError && membersError && goalsError) ? '❌' : '✅');
}

testAuthentication().catch(console.error);