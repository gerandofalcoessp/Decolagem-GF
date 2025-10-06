// Usando fetch nativo do Node.js 18+

const API_BASE_URL = 'http://localhost:4000';

async function debugUserStatus() {
  try {
    console.log('🔍 Debugando status dos usuários no frontend...\n');

    // Fazer login para obter token
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'lemaestro@gerandofalcoes.com',
        password: 'SuperAdmin2024!'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Falha no login');
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Buscar dados dos usuários
    const usersResponse = await fetch(`${API_BASE_URL}/auth/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!usersResponse.ok) {
      throw new Error('Falha ao buscar usuários');
    }

    const usersData = await usersResponse.json();
    console.log('📦 Dados brutos do backend:', JSON.stringify(usersData, null, 2));

    console.log('\n🔍 Análise do status de cada usuário:');
    usersData.users.forEach((user, index) => {
      console.log(`\n👤 Usuário ${index + 1}: ${user.email}`);
      console.log(`   - status (campo direto): ${user.status}`);
      console.log(`   - email_confirmed_at: ${user.email_confirmed_at}`);
      console.log(`   - banned_until: ${user.banned_until}`);
      
      // Simular a lógica do frontend
      const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
      const frontendStatus = isBanned ? 'Bloqueado' : (user.email_confirmed_at ? 'Ativo' : 'Inativo');
      
      console.log(`   - isBanned: ${isBanned}`);
      console.log(`   - Status calculado pelo frontend: ${frontendStatus}`);
      console.log(`   - ❌ PROBLEMA: Backend retorna status="${user.status}", mas frontend calcula "${frontendStatus}"`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugUserStatus();