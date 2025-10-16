// Script para testar a API através do frontend
const fetch = require('node-fetch');

async function testFrontendApi() {
    try {
        console.log('🔍 Testando API através do frontend (porta 3000)...\n');
        
        // Testar o endpoint de atividades através do frontend
        console.log('1. Testando endpoint /api/atividades através do frontend...');
        try {
            const response = await fetch('http://localhost:3000/api/atividades', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000
            });
            
            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Resposta recebida com sucesso');
                console.log('Tipo da resposta:', typeof data);
                console.log('É array:', Array.isArray(data));
                console.log('Keys da resposta:', Object.keys(data));
                
                if (data.data) {
                    console.log('\n📊 Estrutura data.data:');
                    console.log('- Tipo:', typeof data.data);
                    console.log('- É array:', Array.isArray(data.data));
                    console.log('- Length:', data.data?.length || 0);
                }
                
                // Extrair atividades
                let activities = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
                console.log('\n📋 Total de atividades encontradas:', activities.length);
                
                if (activities.length > 0) {
                    console.log('\n🔍 Amostra das primeiras 3 atividades:');
                    activities.slice(0, 3).forEach((activity, index) => {
                        console.log(`Atividade ${index + 1}:`, {
                            id: activity.id,
                            titulo: activity.titulo,
                            atividade_label: activity.atividade_label,
                            tipo: activity.tipo,
                            quantidade: activity.quantidade,
                            regional: activity.regional
                        });
                    });
                    
                    // Procurar especificamente por "Famílias Embarcadas Decolagem"
                    console.log('\n🏠 Procurando por "Famílias Embarcadas Decolagem"...');
                    const familiesActivities = activities.filter(activity => {
                        const searchTerm = 'Famílias Embarcadas Decolagem';
                        const matches = (
                            activity.atividade_label?.includes(searchTerm) ||
                            activity.titulo?.includes(searchTerm) ||
                            activity.tipo?.includes(searchTerm) ||
                            activity.categoria?.includes(searchTerm)
                        );
                        
                        if (matches) {
                            console.log('✅ Encontrada atividade:', {
                                id: activity.id,
                                titulo: activity.titulo,
                                atividade_label: activity.atividade_label,
                                quantidade: activity.quantidade
                            });
                        }
                        
                        return matches;
                    });
                    
                    console.log('\n📊 Resultado da busca:');
                    console.log('- Atividades encontradas:', familiesActivities.length);
                    
                    if (familiesActivities.length > 0) {
                        const total = familiesActivities.reduce((sum, activity) => {
                            const quantidade = parseInt(activity.quantidade) || 0;
                            console.log(`  + Somando ${quantidade} de "${activity.titulo || activity.atividade_label}"`);
                            return sum + quantidade;
                        }, 0);
                        console.log('🧮 Total calculado:', total);
                    } else {
                        console.log('❌ Nenhuma atividade encontrada com "Famílias Embarcadas Decolagem"');
                        
                        // Mostrar todas as labels únicas para debug
                        const uniqueLabels = [...new Set(activities.map(a => a.atividade_label).filter(Boolean))];
                        console.log('\n🏷️  Labels únicas encontradas:');
                        uniqueLabels.slice(0, 10).forEach(label => console.log(`  - "${label}"`));
                        if (uniqueLabels.length > 10) {
                            console.log(`  ... e mais ${uniqueLabels.length - 10} labels`);
                        }
                    }
                } else {
                    console.log('❌ Nenhuma atividade encontrada no array');
                }
                
            } else {
                const errorText = await response.text();
                console.log('❌ Erro na resposta:', response.status, errorText);
            }
            
        } catch (error) {
            console.log('❌ Erro ao testar endpoint:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

testFrontendApi();