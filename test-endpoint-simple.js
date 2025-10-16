const https = require('https');
const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testEndpoint() {
  try {
    console.log('🔍 Testando endpoint /api/regional-activities...\n');
    
    const response = await makeRequest('http://localhost:4000/api/regional-activities');
    
    console.log('Status:', response.status);
    
    if (response.status !== 200) {
      console.error('❌ Erro no endpoint:', response.data);
      return;
    }
    
    const activities = response.data;
    console.log('✅ Total de atividades retornadas:', activities.length);
    
    // Filtrar atividades de "Famílias Embarcadas Decolagem"
    const familiasEmbarcadas = activities.filter(activity => {
      const label = activity.atividade_label || activity.titulo || '';
      return label.toLowerCase().includes('famílias embarcadas decolagem') ||
             label.toLowerCase().includes('familias embarcadas decolagem');
    });
    
    console.log('✅ Atividades "Famílias Embarcadas Decolagem" encontradas:', familiasEmbarcadas.length);
    
    if (familiasEmbarcadas.length > 0) {
      const totalQuantidade = familiasEmbarcadas.reduce((sum, activity) => {
        const qtd = parseInt(activity.quantidade || activity.qtd || 1);
        console.log(`   Somando: ${qtd} (ID: ${activity.id})`);
        return sum + qtd;
      }, 0);
      
      console.log('🎯 Total de famílias pelo endpoint:', totalQuantidade);
      
      console.log('\n📊 Primeira atividade de exemplo:');
      console.log(JSON.stringify(familiasEmbarcadas[0], null, 2));
    } else {
      console.log('⚠️  Nenhuma atividade encontrada no endpoint');
      console.log('\n📊 Exemplo de atividade retornada:');
      if (activities.length > 0) {
        console.log(JSON.stringify(activities[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error.message);
  }
}

testEndpoint();