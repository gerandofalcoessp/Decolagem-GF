async function testLogin() {
  console.log('🔐 Testando login simples...\n');

  try {
    // Testar se o backend está respondendo
    console.log('1. Testando se o backend está respondendo...');
    const healthResponse = await fetch('http://localhost:4000/api/health');
    
    if (healthResponse.ok) {
      console.log('✅ Backend está respondendo');
    } else {
      console.log('❌ Backend não está respondendo:', healthResponse.status);
    }

    // Testar login com diferentes credenciais
    console.log('\n2. Testando login...');
    
    const credentials = [
      { email: 'coord.regional.sp@gerandofalcoes.com', password: 'Teste123!' },
      { email: 'erika.miranda@gerandofalcoes.com', password: 'Teste123!' },
      { email: 'admin@gerandofalcoes.com', password: 'admin123' }
    ];

    for (const cred of credentials) {
      console.log(`\n🔑 Tentando login com: ${cred.email}`);
      
      const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cred)
      });

      console.log(`   Status: ${loginResponse.status} ${loginResponse.statusText}`);
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('   ✅ Login bem-sucedido!');
        console.log('   👤 Usuário:', loginData.user?.name || loginData.user?.email);
        console.log('   🔑 Role:', loginData.user?.role);
        console.log('   🎫 Token presente:', !!loginData.token);
        break;
      } else {
        const errorText = await loginResponse.text();
        console.log('   ❌ Erro:', errorText);
      }
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar o teste
testLogin();