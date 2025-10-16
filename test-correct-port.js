// Script para testar a API na porta correta
const fetch = require('node-fetch');

async function testCorrectPort() {
    try {
        console.log('🔍 Testando API nas portas corretas...\n');
        
        // Testar frontend na porta 3002
        console.log('1. Testando frontend na porta 3002...');
        try {
            const response = await fetch('http://localhost:3002/api/atividades', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000
            });
            
            console.log('Status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Frontend (3002) - Resposta recebida');
                await processResponse(data, 'Frontend (3002)');
            } else {
                console.log('❌ Frontend (3002) - Erro:', response.status);
            }
            
        } catch (error) {
            console.log('❌ Frontend (3002) - Erro:', error.message);
        }
        
        // Testar backend na porta 3001
        console.log('\n2. Testando backend na porta 3001...');
        try {
            const response = await fetch('http://localhost:3001/api/atividades', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000
            });
            
            console.log('Status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend (3001) - Resposta recebida');
                await processResponse(data, 'Backend (3001)');
            } else {
                console.log('❌ Backend (3001) - Erro:', response.status);
            }
            
        } catch (error) {
            console.log('❌ Backend (3001) - Erro:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

async function processResponse(data, source) {
    console.log(`\n📊 ${source} - Estrutura da resposta:`);
    console.log('- Tipo:', typeof data);
    console.log('- É array:', Array.isArray(data));
    console.log('- Keys:', Object.keys(data));
    
    if (data.data) {
        console.log('- data.data tipo:', typeof data.data);
        console.log('- data.data é array:', Array.isArray(data.data));
        console.log('- data.data length:', data.data?.length || 0);
    }
    
    // Extrair atividades
    let activities = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
    console.log(`\n📋 ${source} - Total de atividades:`, activities.length);
    
    if (activities.length > 0) {
        // Procurar por "Famílias Embarcadas Decolagem"
        const familiesActivities = activities.filter(activity => {
            const searchTerm = 'Famílias Embarcadas Decolagem';
            return (
                activity.atividade_label?.includes(searchTerm) ||
                activity.titulo?.includes(searchTerm) ||
                activity.tipo?.includes(searchTerm) ||
                activity.categoria?.includes(searchTerm)
            );
        });
        
        console.log(`🏠 ${source} - Atividades "Famílias Embarcadas Decolagem":`, familiesActivities.length);
        
        if (familiesActivities.length > 0) {
            const total = familiesActivities.reduce((sum, activity) => {
                const quantidade = parseInt(activity.quantidade) || 0;
                return sum + quantidade;
            }, 0);
            console.log(`🧮 ${source} - Total calculado:`, total);
            
            // Mostrar detalhes das primeiras atividades
            console.log(`📋 ${source} - Detalhes das atividades:`);
            familiesActivities.slice(0, 3).forEach((activity, index) => {
                console.log(`  ${index + 1}. ${activity.titulo || activity.atividade_label} - Qtd: ${activity.quantidade}`);
            });
        } else {
            console.log(`❌ ${source} - Nenhuma atividade encontrada`);
            
            // Mostrar algumas labels para debug
            const labels = activities.slice(0, 5).map(a => a.atividade_label || a.titulo).filter(Boolean);
            console.log(`🏷️  ${source} - Primeiras labels:`, labels);
        }
    }
}

testCorrectPort();