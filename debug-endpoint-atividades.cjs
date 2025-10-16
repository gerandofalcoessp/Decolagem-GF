const fetch = require('node-fetch');

async function debugEndpointAtividades() {
  try {
    console.log('🔍 TESTANDO ENDPOINT /api/atividades');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const response = await fetch('http://localhost:4000/api/atividades');
    
    if (!response.ok) {
      console.error(`❌ Erro HTTP: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    
    console.log('📊 RESPOSTA DO ENDPOINT:');
    console.log(`Tipo: ${Array.isArray(data) ? 'Array' : 'Object'}`);
    console.log(`Total de registros: ${Array.isArray(data) ? data.length : 'N/A'}`);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('\n📋 ESTRUTURA DO PRIMEIRO REGISTRO:');
      Object.keys(data[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof data[0][key]} = ${data[0][key]}`);
      });
      
      // Buscar especificamente por "Famílias Embarcadas Decolagem"
      console.log('\n🔍 BUSCANDO "Famílias Embarcadas Decolagem":');
      const familiasEmbarcadas = data.filter(item => 
        item.atividade_label === 'Famílias Embarcadas Decolagem' ||
        (item.titulo && item.titulo.includes('Famílias Embarcadas')) ||
        (item.tipo && item.tipo.includes('Famílias Embarcadas'))
      );
      
      console.log(`✅ Encontrados ${familiasEmbarcadas.length} registros`);
      
      if (familiasEmbarcadas.length > 0) {
        let totalQuantidade = 0;
        
        familiasEmbarcadas.forEach((item, index) => {
          const quantidade = parseInt(item.quantidade) || parseInt(item.qtd) || 1;
          totalQuantidade += quantidade;
          
          console.log(`\n  ${index + 1}. Registro:`);
          console.log(`     atividade_label: ${item.atividade_label || 'N/A'}`);
          console.log(`     titulo: ${item.titulo || 'N/A'}`);
          console.log(`     tipo: ${item.tipo || 'N/A'}`);
          console.log(`     quantidade: ${item.quantidade || 'N/A'}`);
          console.log(`     qtd: ${item.qtd || 'N/A'}`);
          console.log(`     regional: ${item.regional || 'N/A'}`);
          console.log(`     status: ${item.status || 'N/A'}`);
        });
        
        console.log(`\n🎯 TOTAL CALCULADO: ${totalQuantidade}`);
      } else {
        console.log('❌ Nenhum registro encontrado para "Famílias Embarcadas Decolagem"');
        
        // Mostrar todos os labels únicos disponíveis
        const labelsUnicos = [...new Set(data.map(item => 
          item.atividade_label || item.titulo || item.tipo || 'sem_label'
        ))];
        
        console.log('\n📋 Labels únicos disponíveis no endpoint:');
        labelsUnicos.sort().forEach((label, index) => {
          console.log(`  ${index + 1}. "${label}"`);
        });
      }
      
      // Verificar se há registros com status ativo
      console.log('\n📊 RESUMO POR STATUS:');
      const porStatus = {};
      data.forEach(item => {
        const status = item.status || 'sem_status';
        if (!porStatus[status]) porStatus[status] = 0;
        porStatus[status]++;
      });
      
      Object.entries(porStatus).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count} registros`);
      });
      
    } else {
      console.log('❌ Endpoint retornou array vazio ou não é um array');
      console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error.message);
  }
}

debugEndpointAtividades();