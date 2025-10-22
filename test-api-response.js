const fetch = require('node-fetch');

async function testApiResponse() {
  try {
    console.log('🔍 Testando resposta da API...\n');
    
    const response = await fetch('http://localhost:4000/api/instituicoes');
    
    if (!response.ok) {
      console.error('❌ Erro na resposta da API:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ Resposta da API recebida com sucesso\n');
    console.log('📊 Estrutura da resposta:');
    console.log(`   • Tipo: ${typeof data}`);
    console.log(`   • Chaves: ${Object.keys(data).join(', ')}`);
    
    if (data.data && Array.isArray(data.data)) {
      console.log(`   • Total de instituições: ${data.data.length}\n`);
      
      // Analisar as primeiras instituições
      console.log('🎯 ANÁLISE DAS PRIMEIRAS INSTITUIÇÕES:\n');
      
      data.data.slice(0, 5).forEach((inst, index) => {
        console.log(`${index + 1}. ${inst.nome}`);
        console.log(`   • programa: ${JSON.stringify(inst.programa)}`);
        console.log(`   • programas: ${JSON.stringify(inst.programas)}`);
        console.log('');
      });
      
      // Procurar especificamente pelas que deveriam ter múltiplos programas
      const wiseMadness = data.data.find(inst => inst.nome.includes('Wise Madness'));
      const recomecar = data.data.find(inst => inst.nome.includes('Recomeçar'));
      
      if (wiseMadness) {
        console.log('🎯 ASSOCIAÇÃO WISE MADNESS (API):');
        console.log(`   • programa: ${JSON.stringify(wiseMadness.programa)}`);
        console.log(`   • programas: ${JSON.stringify(wiseMadness.programas)}`);
        console.log('');
      }
      
      if (recomecar) {
        console.log('🎯 INSTITUTO RECOMEÇAR (API):');
        console.log(`   • programa: ${JSON.stringify(recomecar.programa)}`);
        console.log(`   • programas: ${JSON.stringify(recomecar.programas)}`);
        console.log('');
      }
      
      // Contar quantas têm múltiplos programas
      const comMultiplos = data.data.filter(inst => 
        inst.programas && Array.isArray(inst.programas) && inst.programas.length > 1
      );
      
      console.log(`📈 ESTATÍSTICAS DA API:`);
      console.log(`   • Instituições com múltiplos programas: ${comMultiplos.length}`);
      
      if (comMultiplos.length > 0) {
        console.log(`   • Nomes:`);
        comMultiplos.forEach(inst => {
          console.log(`     - ${inst.nome}: [${inst.programas.join(', ')}]`);
        });
      }
      
    } else {
      console.log('❌ Estrutura de dados inesperada');
      console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

testApiResponse();