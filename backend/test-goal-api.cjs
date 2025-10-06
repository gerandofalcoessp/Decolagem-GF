const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testCreateGoal() {
  try {
    console.log('Iniciando teste de criação de meta...');
    
    // Primeiro, fazer login para obter o token
    const loginData = await makeRequest('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teste@decolagem.com',
        password: 'Teste123!'
      })
    });
    
    console.log('Login response:', loginData);
    
    if (!loginData.session || !loginData.session.access_token) {
      console.error('Falha no login - token não encontrado');
      return;
    }
    
    const token = loginData.session.access_token;
    
    // Criar uma meta de teste
    const goalData = {
      nome: 'Meta Teste API',
      descricao: 'Meta: 100 unidades | Meses: Janeiro, Fevereiro | Regionais: Nacional, R. São Paulo',
      valor_meta: 100,
      valor_atual: 0,
      due_date: '2025-12-31',
      status: 'pending'
    };
    
    console.log('Criando meta com dados:', goalData);
    
    const createResponse = await makeRequest('http://localhost:4000/goals', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(goalData)
    });
    
    console.log('Resposta da criação:', createResponse);
    
    // Buscar todas as metas para verificar se foi criada
    const goalsResponse = await makeRequest('http://localhost:4000/goals', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Metas encontradas:', goalsResponse);
    
    // Mostrar a meta recém-criada
    if (goalsResponse && goalsResponse.data && goalsResponse.data.length > 0) {
      const lastGoal = goalsResponse.data[goalsResponse.data.length - 1];
      console.log('\n🎯 Última meta criada:');
      console.log('Nome:', lastGoal.nome);
      console.log('Descrição:', lastGoal.descricao);
      console.log('Valor Meta:', lastGoal.valor_meta);
      console.log('Valor Atual:', lastGoal.valor_atual);
      console.log('Data Limite:', lastGoal.due_date);
      console.log('Status:', lastGoal.status);
    } else {
      console.log('❌ Nenhuma meta encontrada');
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testCreateGoal();