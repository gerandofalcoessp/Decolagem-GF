// Teste da nova lógica de visibilidade das metas
const API_BASE_URL = 'http://localhost:4000/api';

async function testGoalsVisibility() {
  console.log('🧪 Testando nova lógica de visibilidade das metas...\n');
  
  const users = [
    {
      name: 'Super Admin (Flávio)',
      email: 'flavio.almeida@gerandofalcoes.com',
      senha: '123456',
      expectedRole: 'super_admin'
    },
    {
      name: 'Usuário Normal (Lemaestro)',
      email: 'lemaestro@gerandofalcoes.com',
      senha: '123456',
      expectedRole: 'user'
    },
    {
      name: 'Usuário Normal (Ana)',
      email: 'ana.neiry@gerandofalcoes.com',
      senha: '123456',
      expectedRole: 'user'
    }
  ];
  
  for (const user of users) {
    console.log(`\n👤 Testando com ${user.name}:`);
    
    try {
      // Fazer login
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          senha: user.senha
        })
      });
      
      if (!loginResponse.ok) {
        console.log(`❌ Erro no login: ${loginResponse.status}`);
        continue;
      }
      
      const loginData = await loginResponse.json();
      const token = loginData.token;
      console.log(`✅ Login realizado com sucesso`);
      
      // Buscar metas
      const goalsResponse = await fetch(`${API_BASE_URL}/goals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!goalsResponse.ok) {
        console.log(`❌ Erro ao buscar metas: ${goalsResponse.status}`);
        const errorText = await goalsResponse.text();
        console.log(`   Erro: ${errorText}`);
        continue;
      }
      
      const goalsData = await goalsResponse.json();
      const goals = goalsData.data || [];
      
      console.log(`📊 Metas visíveis: ${goals.length}`);
      
      if (goals.length > 0) {
        // Verificar member_ids únicos
        const uniqueMemberIds = [...new Set(goals.map(g => g.member_id))];
        console.log(`👥 Member IDs únicos: ${uniqueMemberIds.length}`);
        uniqueMemberIds.forEach(id => {
          const count = goals.filter(g => g.member_id === id).length;
          console.log(`   - ${id}: ${count} metas`);
        });
        
        // Mostrar algumas metas de exemplo
        console.log(`📋 Primeiras 3 metas:`);
        goals.slice(0, 3).forEach((goal, index) => {
          console.log(`   ${index + 1}. ${goal.nome} (Member: ${goal.member_id})`);
        });
      }
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Resultado esperado:');
  console.log('- Super Admin: deve ver todas as 16 metas');
  console.log('- Usuários normais: devem ver as 16 metas criadas pelo super admin');
  console.log('  (já que todas as metas foram criadas por um super admin)');
}

testGoalsVisibility().catch(console.error);