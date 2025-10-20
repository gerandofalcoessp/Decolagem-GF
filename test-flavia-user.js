// Script para testar especificamente o usuário flavia.silva@gerandofalcoes.com
const API_BASE_URL = 'http://localhost:4000/api';

async function testFlaviaUser() {
  console.log('🔍 Testando usuário flavia.silva@gerandofalcoes.com...\n');

  try {
    // 1. Fazer login com flavia.silva
    console.log('1. Fazendo login...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'flavia.silva@gerandofalcoes.com',
        password: 'senha123' // Assumindo senha padrão
      }),
    });

    if (!loginResponse.ok) {
      console.log(`❌ Falha no login: ${loginResponse.status}`);
      const errorText = await loginResponse.text();
      console.log(`   Detalhes: ${errorText}`);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.session?.access_token || loginData.token;
    
    if (!token) {
      console.log(`❌ Token não encontrado`);
      return;
    }

    console.log(`✅ Login realizado com sucesso`);
    console.log(`   Role: ${loginData.user?.role || 'N/A'}`);
    console.log(`   Regional: ${loginData.user?.regional || 'N/A'}`);
    console.log(`   User ID: ${loginData.user?.id || 'N/A'}`);

    // 2. Buscar metas
    console.log('\n2. Buscando metas...');
    const goalsResponse = await fetch(`${API_BASE_URL}/goals`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!goalsResponse.ok) {
      console.log(`❌ Erro ao buscar metas: ${goalsResponse.status}`);
      const errorText = await goalsResponse.text();
      console.log(`   Detalhes: ${errorText}`);
      return;
    }

    const goalsData = await goalsResponse.json();
    console.log(`✅ Metas encontradas: ${goalsData.data?.length || 0}`);
    
    if (goalsData.data && goalsData.data.length > 0) {
      console.log('\n📋 Detalhes das metas:');
      goalsData.data.forEach((meta, index) => {
        console.log(`\nMeta ${index + 1}:`);
        console.log(`  ID: ${meta.id}`);
        console.log(`  Nome: ${meta.nome || meta.title || 'N/A'}`);
        console.log(`  Descrição: ${meta.descricao || meta.description || 'N/A'}`);
        console.log(`  Member ID: ${meta.member_id}`);
        console.log(`  Regional: ${meta.regional || 'N/A'}`);
        console.log(`  Área: ${meta.area || 'N/A'}`);
        console.log(`  Valor Meta: ${meta.valor_meta || meta.target_value || 'N/A'}`);
        console.log(`  Valor Atual: ${meta.valor_atual || meta.current_value || 'N/A'}`);
      });
    } else {
      console.log('\n❌ Nenhuma meta encontrada para este usuário');
    }

    // 3. Verificar dados do member
    console.log('\n3. Verificando dados do member...');
    const memberResponse = await fetch(`${API_BASE_URL}/members/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (memberResponse.ok) {
      const memberData = await memberResponse.json();
      console.log('✅ Dados do member:');
      console.log(`  ID: ${memberData.id}`);
      console.log(`  Email: ${memberData.email}`);
      console.log(`  Nome: ${memberData.name}`);
      console.log(`  Regional: ${memberData.regional || 'N/A'}`);
      console.log(`  Área: ${memberData.area || 'N/A'}`);
      console.log(`  Auth User ID: ${memberData.auth_user_id}`);
    } else {
      console.log('❌ Erro ao buscar dados do member');
    }

    // 4. Verificar todas as metas no sistema (se for super admin)
    console.log('\n4. Verificando total de metas no sistema...');
    if (loginData.user?.role === 'super_admin') {
      // Como super admin, deve ver todas as metas
      console.log('👑 Usuário é super admin - deve ver todas as metas');
    } else {
      console.log('👤 Usuário comum - deve ver apenas suas metas e metas de super admins');
    }

    // 5. Verificar se há metas relacionadas à área "Rio de Janeiro"
    console.log('\n5. Analisando metas por área/regional...');
    if (goalsData.data) {
      const metasPorRegional = {};
      const metasPorArea = {};
      
      goalsData.data.forEach(meta => {
        const regional = meta.regional || 'N/A';
        const area = meta.area || 'N/A';
        
        metasPorRegional[regional] = (metasPorRegional[regional] || 0) + 1;
        metasPorArea[area] = (metasPorArea[area] || 0) + 1;
      });
      
      console.log('Metas por regional:');
      Object.entries(metasPorRegional).forEach(([regional, count]) => {
        console.log(`  - ${regional}: ${count} metas`);
      });
      
      console.log('Metas por área:');
      Object.entries(metasPorArea).forEach(([area, count]) => {
        console.log(`  - ${area}: ${count} metas`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testFlaviaUser();