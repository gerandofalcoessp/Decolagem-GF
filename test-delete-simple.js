// Script simples para testar a API de exclusão
console.log('🔍 Testando conexão com a API...');

// Vamos usar uma abordagem mais simples
const { exec } = require('child_process');

// Primeiro, testar se a API está respondendo
exec('curl -X GET http://localhost:3000/api/regional-activities -H "Content-Type: application/json"', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erro ao conectar com a API:', error.message);
    console.log('⚠️ Verifique se o backend está rodando na porta 3000');
    return;
  }

  if (stderr) {
    console.error('❌ Erro stderr:', stderr);
    return;
  }

  console.log('✅ API respondeu:');
  console.log(stdout);
  
  // Se chegou até aqui, a API está funcionando
  console.log('🎯 API está funcionando. O problema pode estar no frontend ou na autenticação.');
});