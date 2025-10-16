// Debug: Testar chamada da API do frontend
// Este script simula como o frontend faz a chamada para /api/regional-activities

const fetch = require('node-fetch');

async function testFrontendAPICall() {
    console.log('🔍 Testando chamada da API do frontend...\n');
    
    try {
        // Simular a chamada que o frontend faz
        const response = await fetch('http://localhost:4000/api/regional-activities', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Simular um token de autenticação (você pode precisar ajustar isso)
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZTc5YzQwYzAtNzJkYy00YzY5LWI5YzQtNzJkYzRjNjliOWM0IiwiaWF0IjoxNzM3NTU5MzI2LCJleHAiOjE3Mzc2NDU3MjZ9.Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7E'
            }
        });

        console.log('📡 Status da resposta:', response.status);
        console.log('📡 Headers da resposta:', Object.fromEntries(response.headers));

        if (!response.ok) {
            console.log('❌ Erro na resposta:', response.statusText);
            const errorText = await response.text();
            console.log('❌ Corpo do erro:', errorText);
            return;
        }

        const data = await response.json();
        console.log('📊 Dados recebidos:');
        console.log('   - Tipo:', typeof data);
        console.log('   - É array?', Array.isArray(data));
        
        if (Array.isArray(data)) {
            console.log('   - Total de itens:', data.length);
            
            // Filtrar atividades de "Famílias Embarcadas Decolagem"
            const familiasEmbarcadas = data.filter(activity => {
                const label = activity.atividade_label || activity.titulo || activity.tipo || activity.categoria || '';
                return label.toLowerCase().includes('famílias embarcadas decolagem') ||
                       label.toLowerCase().includes('familias_embarcadas_decolagem');
            });
            
            console.log('   - Famílias Embarcadas encontradas:', familiasEmbarcadas.length);
            
            if (familiasEmbarcadas.length > 0) {
                console.log('\n📋 Detalhes das atividades encontradas:');
                familiasEmbarcadas.forEach((activity, index) => {
                    console.log(`   ${index + 1}. ID: ${activity.id}`);
                    console.log(`      Label: "${activity.atividade_label}"`);
                    console.log(`      Quantidade: ${activity.quantidade || activity.qtd || 0}`);
                    console.log(`      Regional: ${activity.regional}`);
                    console.log('');
                });
                
                // Calcular total
                const total = familiasEmbarcadas.reduce((sum, activity) => {
                    const quantidade = activity.quantidade || activity.qtd || 0;
                    return sum + (isNaN(quantidade) ? 0 : quantidade);
                }, 0);
                
                console.log('🧮 Total calculado:', total);
            }
        } else if (data && typeof data === 'object') {
            console.log('   - Propriedades do objeto:', Object.keys(data));
            
            // Verificar se há uma propriedade 'data' ou similar
            if (data.data && Array.isArray(data.data)) {
                console.log('   - data.data é array com', data.data.length, 'itens');
            }
        }

    } catch (error) {
        console.log('❌ Erro na chamada da API:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Dica: Verifique se o backend está rodando na porta 4000');
        }
    }
}

// Executar o teste
testFrontendAPICall();