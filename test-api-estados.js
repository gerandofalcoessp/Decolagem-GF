// Teste para verificar se a API está retornando o campo estados corretamente
const https = require('https');
const http = require('http');

async function testAPI() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/regional-activities',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
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
          const jsonData = JSON.parse(data);
          console.log('📊 Total de atividades:', jsonData.length);
          
          if (jsonData.length > 0) {
            console.log('🔍 Primeira atividade:');
            console.log('- ID:', jsonData[0].id);
            console.log('- Título:', jsonData[0].titulo);
            console.log('- Regional:', jsonData[0].regional);
            console.log('- Estados (raw):', jsonData[0].estados);
            console.log('- Estados (tipo):', typeof jsonData[0].estados);
            console.log('- Estados (array?):', Array.isArray(jsonData[0].estados));
            
            // Verificar se há alguma atividade com estados
            const comEstados = jsonData.filter(activity => activity.estados && activity.estados.length > 0);
            console.log('📍 Atividades com estados:', comEstados.length);
            
            if (comEstados.length > 0) {
              console.log('🎯 Primeira atividade com estados:');
              console.log('- Estados:', comEstados[0].estados);
              console.log('- Tipo:', typeof comEstados[0].estados);
            }
          }
          
          resolve(jsonData);
        } catch (error) {
          console.error('❌ Erro ao parsear JSON:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error.message);
      reject(error);
    });

    req.end();
  });
}

testAPI().catch(console.error);