const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUserCreation() {
  console.log('🧪 Testando criação de usuário...\n');
  
  try {
    // Dados do usuário de teste
    const testUserData = {
      email: `teste.funcao.${Date.now()}@test.com`,
      password: 'TesteFuncao123!',
      nome: 'Usuário Teste Função',
      tipo: 'Regional',
      role: 'membro',
      funcao: 'Coordenador',
      regional: 'R. Sudeste'
    };

    console.log('📝 Dados do usuário de teste:', testUserData);

    // Fazer login como super admin primeiro
    console.log('\n🔐 Fazendo login como super admin...');
    const loginResponse = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'superadmin@decolagem.com',
        password: 'SuperAdmin2024!'
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Erro no login: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.session?.access_token;

    if (!token) {
      throw new Error('Token não encontrado');
    }

    console.log('✅ Login realizado com sucesso');

    // Criar usuário via API
    console.log('\n👤 Criando usuário via API...');
    const createResponse = await fetch('http://localhost:4000/auth/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUserData)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Erro na criação: ${createResponse.status} - ${JSON.stringify(errorData)}`);
    }

    const createData = await createResponse.json();
    console.log('✅ Usuário criado com sucesso');
    console.log('📄 Resposta da API:', createData);

    const userId = createData.user?.id;
    if (!userId) {
      throw new Error('ID do usuário não encontrado na resposta');
    }

    // Aguardar um pouco para garantir que os dados foram salvos
    console.log('\n⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar dados no Supabase Auth
    console.log('\n🔍 Verificando dados no Supabase Auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) {
      console.error('❌ Erro ao buscar usuário no Auth:', authError);
    } else {
      console.log('✅ Dados no Supabase Auth:');
      console.log('- ID:', authUser.user.id);
      console.log('- Email:', authUser.user.email);
      console.log('- user_metadata:', authUser.user.user_metadata);
    }

    // Verificar dados na tabela members
    console.log('\n🔍 Verificando dados na tabela members...');
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    if (memberError) {
      console.error('❌ Erro ao buscar membro:', memberError);
    } else {
      console.log('✅ Dados na tabela members:');
      console.log('- ID:', memberData.id);
      console.log('- auth_user_id:', memberData.auth_user_id);
      console.log('- name:', memberData.name);
      console.log('- email:', memberData.email);
      console.log('- funcao:', memberData.funcao);
      console.log('- area:', memberData.area);
    }

    // Testar endpoint /auth/users para ver como os dados são retornados
    console.log('\n🔍 Testando endpoint /auth/users...');
    const usersResponse = await fetch('http://localhost:4000/auth/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      const testUser = usersData.users.find(u => u.id === userId);
      
      if (testUser) {
        console.log('✅ Usuário encontrado no endpoint /auth/users:');
        console.log('- ID:', testUser.id);
        console.log('- Email:', testUser.email);
        console.log('- Nome:', testUser.nome);
        console.log('- Role:', testUser.role);
        console.log('- Regional:', testUser.regional);
        console.log('- Funcao:', testUser.funcao);
        console.log('- Tipo:', testUser.tipo);
      } else {
        console.log('❌ Usuário não encontrado no endpoint /auth/users');
      }
    } else {
      console.error('❌ Erro ao buscar usuários:', usersResponse.status);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testUserCreation();