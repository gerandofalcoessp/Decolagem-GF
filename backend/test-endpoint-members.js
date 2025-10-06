import 'dotenv/config';

const API_BASE = 'http://localhost:3001/api';

async function testMemberEndpoint() {
  console.log('🧪 Testando endpoint de criação de membros...\n');

  try {
    // 1. Fazer login para obter token
    console.log('1. Fazendo login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@decolagemgf.com.br',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Erro no login:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    console.log('✅ Login realizado com sucesso');

    // 2. Buscar regionals disponíveis
    console.log('\n2. Buscando regionals...');
    const regionalsResponse = await fetch(`${API_BASE}/regionals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!regionalsResponse.ok) {
      console.error('❌ Erro ao buscar regionals:', await regionalsResponse.text());
      return;
    }

    const regionalsData = await regionalsResponse.json();
    if (!regionalsData.data || regionalsData.data.length === 0) {
      console.error('❌ Nenhuma regional encontrada');
      return;
    }

    const regionalId = regionalsData.data[0].id;
    console.log('✅ Regional encontrada:', regionalsData.data[0].name);

    // 3. Tentar criar um membro
    console.log('\n3. Tentando criar membro...');
    const memberData = {
      name: `Teste Membro ${Date.now()}`,
      email: `teste-${Date.now()}@example.com`,
      regional_id: regionalId,
      funcao: 'Teste',
      area: 'Teste'
    };

    console.log('Dados do membro:', memberData);

    const createResponse = await fetch(`${API_BASE}/members`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(memberData)
    });

    const responseText = await createResponse.text();
    console.log('Status da resposta:', createResponse.status);
    console.log('Resposta completa:', responseText);

    if (createResponse.ok) {
      const memberResult = JSON.parse(responseText);
      console.log('✅ Membro criado com sucesso:', memberResult.data.name);
      
      // Limpar teste
      const deleteResponse = await fetch(`${API_BASE}/members/${memberResult.data.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (deleteResponse.ok) {
        console.log('🧹 Membro de teste removido');
      }
    } else {
      console.error('❌ Erro ao criar membro:', responseText);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testMemberEndpoint();