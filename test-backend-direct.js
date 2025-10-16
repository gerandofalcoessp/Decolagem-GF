// Script para testar diretamente o backend
const fetch = require('node-fetch');

async function testBackendDirect() {
    try {
        console.log('🔍 Testando backend diretamente...\n');
        
        // Primeiro, vamos testar se o backend está rodando
        console.log('1. Testando se o backend está ativo...');
        try {
            const healthResponse = await fetch('http://localhost:3001/health', {
                method: 'GET',
                timeout: 5000
            });
            console.log('✅ Backend está rodando na porta 3001');
        } catch (error) {
            console.log('❌ Backend não está rodando na porta 3001');
            console.log('Tentando porta 3000...');
        }
        
        // Testar o endpoint de atividades sem autenticação primeiro
        console.log('\n2. Testando endpoint /api/atividades...');
        try {
            const response = await fetch('http://localhost:3001/api/atividades', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000
            });
            
            console.log('Status:', response.status);
            console.log('Headers:', Object.fromEntries(response.headers.entries()));
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Resposta recebida');
                console.log('Tipo:', typeof data);
                console.log('É array:', Array.isArray(data));
                
                if (data.data) {
                    console.log('data.data existe');
                    console.log('data.data tipo:', typeof data.data);
                    console.log('data.data é array:', Array.isArray(data.data));
                    console.log('data.data length:', data.data?.length || 0);
                }
                
                // Procurar por atividades relacionadas a famílias
                let activities = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
                console.log('\nTotal de atividades:', activities.length);
                
                if (activities.length > 0) {
                    console.log('\nPrimeiras 3 atividades:');
                    activities.slice(0, 3).forEach((activity, index) => {
                        console.log(`Atividade ${index + 1}:`, {
                            id: activity.id,
                            titulo: activity.titulo,
                            atividade_label: activity.atividade_label,
                            tipo: activity.tipo,
                            quantidade: activity.quantidade
                        });
                    });
                    
                    // Procurar especificamente por "Famílias Embarcadas Decolagem"
                    const familiesActivities = activities.filter(activity => {
                        const searchTerm = 'Famílias Embarcadas Decolagem';
                        return (
                            activity.atividade_label?.includes(searchTerm) ||
                            activity.titulo?.includes(searchTerm) ||
                            activity.tipo?.includes(searchTerm)
                        );
                    });
                    
                    console.log('\n🏠 Atividades "Famílias Embarcadas Decolagem" encontradas:', familiesActivities.length);
                    if (familiesActivities.length > 0) {
                        console.log('Detalhes:', familiesActivities);
                        const total = familiesActivities.reduce((sum, act) => sum + (parseInt(act.quantidade) || 0), 0);
                        console.log('Total calculado:', total);
                    }
                }
            } else {
                const errorText = await response.text();
                console.log('❌ Erro na resposta:', errorText);
            }
            
        } catch (error) {
            console.log('❌ Erro ao testar endpoint:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

testBackendDirect();