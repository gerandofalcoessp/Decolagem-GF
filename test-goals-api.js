// Script para testar a API /goals e verificar se as metas estão sendo retornadas
const API_BASE_URL = 'http://localhost:4000';

async function testGoalsAPI() {
  console.log('🔍 Testando API /goals...\n');

  try {
    // Primeiro, fazer login para obter o token
    console.log('1. Fazendo login...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@decolagem.com',
        password: 'Teste123!'
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Erro no login: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.session?.access_token;

    if (!token) {
      throw new Error('Token não encontrado na resposta do login');
    }

    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário:', loginData.user?.email);
    console.log('🔑 Token obtido:', token.substring(0, 20) + '...\n');

    // Agora, buscar as metas
    console.log('2. Buscando metas...');
    const goalsResponse = await fetch(`${API_BASE_URL}/goals`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!goalsResponse.ok) {
      throw new Error(`Erro ao buscar metas: ${goalsResponse.status} ${goalsResponse.statusText}`);
    }

    const goalsData = await goalsResponse.json();
    console.log('✅ Resposta da API /goals recebida');
    console.log('📊 Estrutura da resposta:', Object.keys(goalsData));
    console.log('📋 Dados completos:', JSON.stringify(goalsData, null, 2));

    // Analisar os dados
    if (goalsData.data && Array.isArray(goalsData.data)) {
      console.log(`\n📈 Total de metas encontradas: ${goalsData.data.length}`);
      
      if (goalsData.data.length > 0) {
        console.log('\n🎯 Detalhes das metas:');
        goalsData.data.forEach((goal, index) => {
          console.log(`\nMeta ${index + 1}:`);
          console.log(`  ID: ${goal.id}`);
          console.log(`  Título: ${goal.title || 'N/A'}`);
          console.log(`  Descrição: ${goal.description || 'N/A'}`);
          console.log(`  Quantidade: ${goal.quantidade || 'N/A'}`);
          console.log(`  Mês: ${goal.mes || 'N/A'}`);
          console.log(`  Ano: ${goal.ano || 'N/A'}`);
          console.log(`  Regionais: ${goal.regionais || 'N/A'}`);
          console.log(`  Member ID: ${goal.member_id || 'N/A'}`);
          console.log(`  Criado em: ${goal.created_at || 'N/A'}`);
        });
      } else {
        console.log('⚠️  Nenhuma meta encontrada no banco de dados');
      }
    } else {
      console.log('⚠️  Formato de resposta inesperado:', goalsData);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar o teste
testGoalsAPI();