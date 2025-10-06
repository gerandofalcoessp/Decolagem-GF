const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:4000';

async function testDeleteUser() {
  console.log('🧪 Testando exclusão de usuário...');
  
  // Primeiro, fazer login para obter token
  const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'flavio.almeida@gerandofalcoes.com',
      password: 'Gf@2024'
    })
  });
  
  if (!loginResponse.ok) {
    console.error('❌ Erro no login:', await loginResponse.text());
    return;
  }
  
  const loginData = await loginResponse.json();
  const token = loginData.access_token;
  console.log('✅ Login realizado com sucesso');
  
  // Testar com o auth_user_id correto do usuário gf.sandbox+dev
  const targetAuthUserId = '8a3d20ef-a16e-4479-ad85-ba2b527c08b8';
  
  console.log(`🎯 Tentando excluir usuário com auth_user_id: ${targetAuthUserId}`);
  
  const deleteResponse = await fetch(`${API_BASE_URL}/api/auth/users/${targetAuthUserId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  console.log('📊 Status da resposta:', deleteResponse.status);
  
  if (deleteResponse.ok) {
    console.log('✅ Usuário excluído com sucesso!');
  } else {
    const errorText = await deleteResponse.text();
    console.error('❌ Erro na exclusão:', errorText);
  }
}

testDeleteUser().catch(console.error);