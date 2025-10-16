const fetch = require('node-fetch');
require('dotenv').config();

async function testRegionalActivitiesEndpoint() {
  try {
    console.log('🔍 Testando endpoint de atividades regionais...');
    
    // Fazer requisição para o endpoint local
    const response = await fetch('http://localhost:3001/api/regional-activities', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Adicionar token de autenticação se necessário
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });

    if (!response.ok) {
      console.error('❌ Erro na requisição:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('📊 Total de atividades retornadas:', data.length);

    // Filtrar atividades de "Famílias Embarcadas Decolagem"
    const familiasEmbarcadas = data.filter(activity => {
      const titulo = activity.titulo || '';
      const tipo = activity.tipo || '';
      const descricao = activity.descricao || '';
      
      return titulo.toLowerCase().includes('famílias embarcadas decolagem') ||
             tipo.toLowerCase().includes('famílias embarcadas decolagem') ||
             descricao.toLowerCase().includes('famílias embarcadas decolagem');
    });

    console.log('👨‍👩‍👧‍👦 Atividades "Famílias Embarcadas Decolagem" encontradas:', familiasEmbarcadas.length);
    
    if (familiasEmbarcadas.length > 0) {
      console.log('\n📋 Detalhes das atividades encontradas:');
      familiasEmbarcadas.forEach((activity, index) => {
        console.log(`\n${index + 1}. ID: ${activity.id}`);
        console.log(`   Título: ${activity.titulo}`);
        console.log(`   Tipo: ${activity.tipo}`);
        console.log(`   Quantidade: ${activity.quantidade}`);
        console.log(`   Regional: ${activity.regional}`);
        console.log(`   Status: ${activity.status}`);
        console.log(`   Data: ${activity.data_inicio}`);
      });

      const totalQuantidade = familiasEmbarcadas.reduce((sum, activity) => {
        const quantidade = parseInt(activity.quantidade) || 0;
        return sum + quantidade;
      }, 0);

      console.log(`\n✅ Total de famílias embarcadas: ${totalQuantidade}`);
    } else {
      console.log('\n❌ Nenhuma atividade "Famílias Embarcadas Decolagem" encontrada no endpoint');
      
      // Mostrar algumas atividades para debug
      console.log('\n🔍 Primeiras 5 atividades para debug:');
      data.slice(0, 5).forEach((activity, index) => {
        console.log(`\n${index + 1}. ID: ${activity.id}`);
        console.log(`   Título: ${activity.titulo}`);
        console.log(`   Tipo: ${activity.tipo}`);
        console.log(`   Regional: ${activity.regional}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error.message);
  }
}

testRegionalActivitiesEndpoint();