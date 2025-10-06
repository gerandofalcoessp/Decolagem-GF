// Using native fetch (Node.js 18+)

async function testRegionalUsersAPI() {
  try {
    // Login first to get token
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'coord.regional.co@gerandofalcoes.com',
        password: 'Gf@2024'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.log('❌ Erro no login:', loginData);
      return;
    }
    
    const token = loginData.access_token;
    console.log('✅ Login realizado com sucesso');
    
    // Test the /api/regionals/users endpoint
    const usersResponse = await fetch('http://localhost:4000/api/regionals/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const usersData = await usersResponse.json();
    
    if (!usersResponse.ok) {
      console.log('❌ Erro ao buscar usuários:', usersData);
      return;
    }
    
    console.log('✅ Dados retornados pela API /api/regionals/users:');
    console.log('Total de usuários:', usersData.users?.length || 0);
    
    if (usersData.users && usersData.users.length > 0) {
      console.log('\n📋 Lista de usuários:');
      usersData.users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Auth ID: ${user.auth_user_id}`);
        console.log(`   Nome: ${user.nome}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Regional: ${user.regional}`);
        console.log('');
      });
      
      // Check if the problematic user is in the list
      const problematicUser = usersData.users.find(u => 
        u.id === '11caf54b-00fc-41a4-b9a8-90d08ec220cf' || 
        u.auth_user_id === '11caf54b-00fc-41a4-b9a8-90d08ec220cf'
      );
      
      if (problematicUser) {
        console.log('🚨 USUÁRIO PROBLEMÁTICO ENCONTRADO NA API:');
        console.log(JSON.stringify(problematicUser, null, 2));
      } else {
        console.log('✅ Usuário problemático NÃO encontrado na API');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testRegionalUsersAPI();