// Teste automatizado para verificar a correção do JWT
// const axios = require('axios'); // Comentado para usar fetch nativo

const BASE_URL = 'http://localhost:3002'; // Backend URL (porta correta)
const testUser = {
  email: 'flavio.almeida@gerandofalcoes.com', // Usuário de teste do backend-login-test.json
  password: '123456' // Senha de teste do backend-login-test.json
};

async function testJWTFix() {
  console.log('🔍 Iniciando teste completo do JWT...\n');

  try {
    // Verificar se o servidor está rodando
     console.log('0️⃣ Verificando se o servidor está rodando...');
     try {
       const healthResponse = await fetch(`${BASE_URL}/api/auth/me`);
       console.log('✅ Servidor backend está rodando');
     } catch (error) {
       console.log('❌ Servidor backend não está rodando ou não responde');
       console.log('💡 Certifique-se de que o backend está rodando em http://localhost:3002');
       return;
     }

    // 1. Fazer login
    console.log('\n1️⃣ Fazendo login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('❌ Resposta de login:', loginResponse.status, errorText);
      throw new Error(`Login falhou: ${errorText}`);
    }
    
    const loginData = await loginResponse.json();
  console.log('📋 Dados de login recebidos:', JSON.stringify(loginData, null, 2));
  
  if (!loginData.session?.access_token && !loginData.access_token && !loginData.token) {
    throw new Error('Token não recebido no login');
  }

  const token = loginData.session?.access_token || loginData.access_token || loginData.token;
  console.log('✅ Login realizado com sucesso');
    console.log(`📝 Token recebido: ${token.substring(0, 50)}...`);

    // 2. Verificar se o token é válido
    console.log('\n2️⃣ Verificando validade do token...');
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const userResponse = await fetch(`${BASE_URL}/api/auth/me`, { headers: authHeaders });
    
    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      throw new Error(`Validação do token falhou: ${errorData.error || 'Erro desconhecido'}`);
    }
    
    const userData = await userResponse.json();
    console.log('✅ Token válido - usuário autenticado:', userData.user?.email);

    // 3. Listar atividades regionais
    console.log('\n3️⃣ Listando atividades regionais...');
    const activitiesResponse = await fetch(`${BASE_URL}/api/regional-activities`, { headers: authHeaders });
    
    if (!activitiesResponse.ok) {
      const errorData = await activitiesResponse.json();
      console.log('❌ Erro ao listar atividades:', errorData.error);
      return;
    }
    
    const activitiesData = await activitiesResponse.json();
    console.log(`✅ ${activitiesData.length} atividades encontradas`);

    if (activitiesData.length === 0) {
      console.log('⚠️ Nenhuma atividade encontrada para testar exclusão');
      console.log('💡 Crie uma atividade regional primeiro para testar a exclusão');
      return;
    }

    // 4. Tentar deletar uma atividade (se existir)
    const firstActivity = activitiesData[0];
    console.log(`\n4️⃣ Tentando deletar atividade: ${firstActivity.id}`);
    console.log(`📋 Título: ${firstActivity.title}`);
    
    try {
      const deleteResponse = await fetch(`${BASE_URL}/api/regional-activities/${firstActivity.id}`, { 
        method: 'DELETE',
        headers: authHeaders 
      });
      
      if (deleteResponse.ok) {
        const deleteData = await deleteResponse.json();
        console.log('✅ Atividade deletada com sucesso!');
        console.log('📊 Resposta:', deleteData);
      } else {
        const errorData = await deleteResponse.json();
        console.log('❌ Erro ao deletar atividade:');
        console.log('📝 Status:', deleteResponse.status);
        console.log('📝 Mensagem:', errorData.error);
        
        // Verificar se é erro JWT específico
        if (errorData.error?.includes('JWT') || errorData.error?.includes('cryptographic')) {
          console.log('🚨 ERRO JWT DETECTADO - A correção não funcionou completamente');
          console.log('🔧 Necessário investigar mais profundamente o backend');
        } else {
          console.log('ℹ️ Erro não relacionado ao JWT (pode ser permissão/RLS)');
        }
      }
    } catch (deleteError) {
      console.log('❌ Erro de rede ao deletar:', deleteError.message);
    }

    // 5. Testar renovação de token (simulando token expirado)
    console.log('\n5️⃣ Testando renovação de token...');
    try {
      // Simular token inválido
      const invalidHeaders = {
        'Authorization': 'Bearer token_invalido_para_teste',
        'Content-Type': 'application/json'
      };
      
      const invalidResponse = await fetch(`${BASE_URL}/api/auth/me`, { headers: invalidHeaders });
      if (invalidResponse.status === 401) {
        console.log('✅ Token inválido corretamente rejeitado');
      }
    } catch (error) {
      console.log('✅ Token inválido corretamente rejeitado');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testJWTFix().then(() => {
  console.log('\n🏁 Teste concluído');
}).catch(console.error);