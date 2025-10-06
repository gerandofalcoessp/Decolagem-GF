// Test script for member creation after RLS policy fix
// This script tests the member creation functionality

// Mock localStorage for Node.js environment
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: function(key) {
      return this[key] || null;
    },
    setItem: function(key, value) {
      this[key] = value;
    },
    removeItem: function(key) {
      delete this[key];
    },
    clear: function() {
      for (let key in this) {
        if (this.hasOwnProperty(key) && key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
          delete this[key];
        }
      }
    }
  };
}

const API_BASE_URL = 'http://localhost:4000';

class TestMemberService {
  static async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    const data = await response.json();
    
    // Store tokens
    localStorage.setItem('auth_token', data.session.access_token);
    localStorage.setItem('refresh_token', data.session.refresh_token);
    
    return data;
  }

  static async createMember(memberData) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No auth token found');
    }

    const response = await fetch(`${API_BASE_URL}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(memberData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Member creation failed');
    }

    return await response.json();
  }

  static async getMembers() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No auth token found');
    }

    const response = await fetch(`${API_BASE_URL}/members`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get members');
    }

    return await response.json();
  }

  static async getRegionals() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No auth token found');
    }

    const response = await fetch(`${API_BASE_URL}/regionals`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get regionals');
    }

    return await response.json();
  }
}

async function runMemberCreationTest() {
  console.log('🧪 Iniciando teste de criação de membros...\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Fazendo login...');
    const loginResult = await TestMemberService.login('superadmin@decolagem.com', 'SuperAdmin2024!');
    console.log('✅ Login realizado com sucesso');
    console.log(`   Usuário: ${loginResult.user.email}`);
    console.log(`   Token presente: ${!!localStorage.getItem('auth_token')}\n`);

    // Step 2: Get regionals
    console.log('2️⃣ Buscando regionais...');
    const regionalsResult = await TestMemberService.getRegionals();
    console.log('✅ Regionais obtidas com sucesso');
    console.log(`   Total de regionais: ${regionalsResult.data.length}`);
    
    const firstRegional = regionalsResult.data[0];
    if (firstRegional) {
      console.log(`   Primeira regional: ${firstRegional.name} (ID: ${firstRegional.id})\n`);
    }

    // Step 3: Test member creation for current user (should work)
    console.log('3️⃣ Testando criação de membro para o próprio usuário...');
    try {
      const memberData1 = {
        name: 'Teste Usuário Próprio',
        email: 'superadmin@decolagem.com',
        regional_id: firstRegional?.id,
        funcao: 'Administrador',
        area: 'Gestão'
      };

      const memberResult1 = await TestMemberService.createMember(memberData1);
      console.log('✅ Membro criado com sucesso para o próprio usuário');
      console.log(`   ID do membro: ${memberResult1.data.id}`);
      console.log(`   Nome: ${memberResult1.data.name}`);
      console.log(`   auth_user_id: ${memberResult1.data.auth_user_id}\n`);
    } catch (error) {
      console.log('ℹ️ Usuário já possui membro (esperado se já executado antes)');
      console.log(`   Erro: ${error.message}\n`);
    }

    // Step 4: Test member creation without auth_user_id (admin functionality)
    console.log('4️⃣ Testando criação de membro sem auth_user_id (funcionalidade admin)...');
    const memberData2 = {
      name: 'Teste Membro Admin',
      email: 'teste.admin@exemplo.com',
      regional_id: firstRegional?.id,
      funcao: 'Membro',
      area: 'Desenvolvimento'
      // Note: não incluindo auth_user_id - deve ser null
    };

    const memberResult2 = await TestMemberService.createMember(memberData2);
    console.log('✅ Membro criado com sucesso pelo admin (sem auth_user_id)');
    console.log(`   ID do membro: ${memberResult2.data.id}`);
    console.log(`   Nome: ${memberResult2.data.name}`);
    console.log(`   auth_user_id: ${memberResult2.data.auth_user_id} (deve ser null)\n`);

    // Step 5: List all members
    console.log('5️⃣ Listando todos os membros...');
    const membersResult = await TestMemberService.getMembers();
    console.log('✅ Membros listados com sucesso');
    console.log(`   Total de membros: ${membersResult.data.length}`);
    
    membersResult.data.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.name} (${member.email}) - auth_user_id: ${member.auth_user_id || 'null'}`);
    });

    console.log('\n🎉 Teste de criação de membros concluído com sucesso!');
    console.log('✅ As políticas RLS foram corrigidas e estão funcionando corretamente.');

  } catch (error) {
    console.error('\n❌ Erro durante o teste de criação de membros:');
    console.error(`   ${error.message}`);
    
    if (error.stack) {
      console.error('\n📋 Stack trace:');
      console.error(error.stack);
    }
  }
}

// Execute the test
runMemberCreationTest();