const axios = require('axios');

async function testEndpoint() {
    try {
        console.log('Testando endpoint /api/regional-activities...');
        
        const response = await axios.get('http://localhost:4000/api/regional-activities', {
            headers: {
                'Authorization': 'Bearer test-token' // Pode precisar de um token válido
            }
        });
        
        console.log('Status:', response.status);
        console.log('Total de atividades retornadas:', response.data.length);
        
        // Filtrar atividades de "Famílias Embarcadas Decolagem"
        const familiasEmbarcadas = response.data.filter(activity => {
            const label = activity.atividade_label || activity.titulo || '';
            return label.toLowerCase().includes('famílias embarcadas decolagem') ||
                   label.toLowerCase().includes('familias_embarcadas_decolagem');
        });
        
        console.log('Atividades "Famílias Embarcadas Decolagem" encontradas:', familiasEmbarcadas.length);
        
        if (familiasEmbarcadas.length > 0) {
            const totalQuantidade = familiasEmbarcadas.reduce((sum, activity) => {
                const qtd = parseInt(activity.quantidade || activity.qtd || 1);
                return sum + qtd;
            }, 0);
            
            console.log('Total de famílias:', totalQuantidade);
            console.log('Primeira atividade:', familiasEmbarcadas[0]);
        }
        
    } catch (error) {
        console.error('Erro ao testar endpoint:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testEndpoint();