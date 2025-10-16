// Script para verificar o token de autenticação
const { JSDOM } = require('jsdom');

// Simular o ambiente do navegador
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3001',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;

console.log('🔍 Verificando token de autenticação...\n');

// Verificar se existe token no localStorage
const token = localStorage.getItem('auth_token');
console.log(`Token presente: ${!!token}`);
console.log(`Token valor: ${token ? token.substring(0, 20) + '...' : 'null'}`);

// Simular um token válido para teste
if (!token) {
  console.log('\n⚠️ Nenhum token encontrado. Simulando token válido...');
  localStorage.setItem('auth_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
  console.log('✅ Token simulado definido');
}

// Testar endpoint com token
const http = require('http');

const testEndpoint = () => {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('auth_token');
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/regional-activities',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
};

// Testar o endpoint
testEndpoint()
  .then(result => {
    console.log(`\n📡 Teste do endpoint /api/regional-activities:`);
    console.log(`Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log('✅ Endpoint funcionando!');
      const activities = result.data.data || result.data;
      console.log(`📊 Total de atividades: ${activities.length}`);
      
      // Filtrar atividades de "Famílias Embarcadas Decolagem"
      const familiasActivities = activities.filter(activity => {
        const label = activity.label || activity.atividade || '';
        return label.toLowerCase().includes('famílias embarcadas decolagem') ||
               label.toLowerCase().includes('familias embarcadas decolagem');
      });
      
      console.log(`👨‍👩‍👧‍👦 Atividades "Famílias Embarcadas": ${familiasActivities.length}`);
      
      if (familiasActivities.length > 0) {
        const total = familiasActivities.reduce((sum, activity) => {
          return sum + (activity.quantidade || activity.quantity || 0);
        }, 0);
        console.log(`📈 Total de famílias: ${total}`);
      }
    } else {
      console.log(`❌ Erro: ${JSON.stringify(result.data)}`);
    }
  })
  .catch(err => {
    console.log(`❌ Erro na requisição: ${err.message}`);
  });