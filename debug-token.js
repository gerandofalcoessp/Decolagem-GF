async function debugToken() {
  console.log('🔍 Debugando token JWT...\n');

  try {
    // 1. Fazer login
    console.log('1. Fazendo login...');
    const loginResponse = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@decolagem.com',
        password: 'Teste123!'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      throw new Error(`Login falhou: ${loginData.error}`);
    }

    const token = loginData.session?.access_token || loginData.token;
    console.log('✅ Login realizado com sucesso');
    console.log('📋 Dados de login completos:', JSON.stringify(loginData, null, 2));
    
    if (!token) {
      console.log('❌ Token não encontrado na resposta!');
      return;
    }
    
    console.log(`🔑 Token recebido: ${token.substring(0, 50)}...`);

    // 2. Verificar estrutura do token (base64 decode)
    console.log('\n2. Verificando estrutura do token...');
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('✅ Payload do token:');
        console.log('   User ID:', payload.sub);
        console.log('   Email:', payload.email);
        console.log('   Expira em:', new Date(payload.exp * 1000).toISOString());
        console.log('   Emitido em:', new Date(payload.iat * 1000).toISOString());
      }
    } catch (decodeError) {
      console.error('❌ Erro ao decodificar token:', decodeError);
    }

    // 3. Testar o token diretamente
    console.log('\n3. Testando token na API...');
    const testResponse = await fetch('http://localhost:4000/goals', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status da resposta: ${testResponse.status}`);
    console.log(`   Headers da resposta:`, Object.fromEntries(testResponse.headers.entries()));

    const testData = await testResponse.text();
    console.log(`   Corpo da resposta: ${testData}`);

    // 4. Testar sem Bearer prefix
    console.log('\n4. Testando sem Bearer prefix...');
    const testResponse2 = await fetch('http://localhost:4000/goals', {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status da resposta: ${testResponse2.status}`);
    const testData2 = await testResponse2.text();
    console.log(`   Corpo da resposta: ${testData2}`);

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

debugToken();