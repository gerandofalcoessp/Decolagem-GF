require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testPasswordReset() {
  const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    console.log('🔍 Testando reset de senha para usuário...');
    
    // Buscar o usuário específico
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError);
      return;
    }
    
    const targetUser = users.users.find(u => u.email === 'leo.martins@gerandofalcoes.com');
    
    if (!targetUser) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('✅ Usuário encontrado:', targetUser.email);
    console.log('📅 Criado em:', targetUser.created_at);
    console.log('🔐 Último login:', targetUser.last_sign_in_at);
    console.log('📧 Email confirmado:', targetUser.email_confirmed_at);
    
    // Tentar redefinir a senha para uma senha conhecida
    console.log('\n🔄 Redefinindo senha para "senha123"...');
    
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      {
        password: 'senha123'
      }
    );
    
    if (updateError) {
      console.error('❌ Erro ao redefinir senha:', updateError);
      return;
    }
    
    console.log('✅ Senha redefinida com sucesso!');
    
    // Agora testar o login
    console.log('\n🔐 Testando login com nova senha...');
    
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'leo.martins@gerandofalcoes.com',
        password: 'senha123'
      }),
    });
    
    console.log('Status do login:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login bem-sucedido!');
      console.log('Token obtido:', loginData.session?.access_token ? 'Sim' : 'Não');
    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Login falhou:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testPasswordReset();