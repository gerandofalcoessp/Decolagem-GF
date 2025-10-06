// Usando fetch nativo do Node.js (disponível a partir da versão 18)
const fetch = globalThis.fetch;

const API_BASE_URL = 'http://localhost:4000';

async function testMembersWithFuncao() {
  console.log('🧪 Testando busca de membros com campo funcao...\n');

  try {
    // 1. Login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'superadmin@decolagem.com',
        password: 'SuperAdmin2024!'
      }),
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      throw new Error(`Erro no login: ${loginData.error}`);
    }

    const token = loginData.session?.access_token;
    if (!token) {
      throw new Error('Token não recebido no login');
    }

    console.log('✅ Login realizado com sucesso');
    console.log(`   Token presente: ${!!token}\n`);

    // 2. Buscar membros
    console.log('2️⃣ Buscando membros...');
    const membersResponse = await fetch(`${API_BASE_URL}/members`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const membersData = await membersResponse.json();
    
    if (!membersResponse.ok) {
      throw new Error(`Erro ao buscar membros: ${membersData.error}`);
    }

    console.log('✅ Membros obtidos com sucesso');
    console.log(`   Total de membros: ${membersData.data?.length || 0}\n`);

    // 3. Analisar campos dos membros
    console.log('3️⃣ Analisando campos dos membros...');
    if (membersData.data && membersData.data.length > 0) {
      const firstMember = membersData.data[0];
      console.log('📋 Campos disponíveis no primeiro membro:');
      Object.keys(firstMember).forEach(key => {
        console.log(`   - ${key}: ${firstMember[key]}`);
      });
      console.log('');

      // 4. Verificar campo funcao especificamente
      console.log('4️⃣ Verificando campo funcao em todos os membros...');
      membersData.data.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.name || 'Nome não disponível'}`);
        console.log(`      Email: ${member.email || 'N/A'}`);
        console.log(`      Função: ${member.funcao || 'Não definido'}`);
        console.log(`      Área: ${member.area || 'Não definido'}`);
        console.log(`      Regional ID: ${member.regional_id || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum membro encontrado');
    }

    console.log('🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testMembersWithFuncao();