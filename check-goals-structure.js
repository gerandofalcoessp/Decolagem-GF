// Usando fetch nativo do Node.js 18+
const API_BASE_URL = 'http://localhost:3000/api';

async function checkGoalsData() {
  try {
    console.log('🔍 Verificando estrutura dos dados das metas...');
    
    // Fazer login
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teste@decolagem.com',
        senha: '123456'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Erro no login');
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login realizado com sucesso');
    
    // Buscar metas
    const goalsResponse = await fetch(`${API_BASE_URL}/goals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!goalsResponse.ok) {
      throw new Error('Erro ao buscar metas');
    }
    
    const goalsData = await goalsResponse.json();
    const goals = goalsData.data || [];
    
    console.log(`📊 Total de metas encontradas: ${goals.length}`);
    
    if (goals.length > 0) {
      console.log('\n📋 Primeira meta completa:');
      console.log(JSON.stringify(goals[0], null, 2));
      
      console.log('\n🔍 Campos disponíveis na primeira meta:');
      Object.keys(goals[0]).forEach(key => {
        console.log(`  ${key}: ${goals[0][key]}`);
      });
      
      console.log('\n🎯 Verificando campos essenciais:');
      const essentialFields = ['id', 'nome', 'descricao', 'valor_meta', 'valor_atual', 'due_date', 'status'];
      essentialFields.forEach(field => {
        const value = goals[0][field];
        console.log(`  ${field}: ${value !== undefined ? value : 'AUSENTE'}`);
      });
    } else {
      console.log('❌ Nenhuma meta encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkGoalsData();