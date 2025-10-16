// Script para obter um token válido fazendo login
const fetch = require('node-fetch');

async function getValidToken() {
    console.log('🔐 Obtendo token válido através de login...\n');
    
    try {
        // Fazer login para obter token válido
        console.log('1. Fazendo login...');
        const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'flavio.almeida@gerandofalcoes.com',
                password: '123456'
            })
        });

        console.log('📡 Status do login:', loginResponse.status);
        
        if (!loginResponse.ok) {
            const errorData = await loginResponse.text();
            console.log('❌ Erro no login:', errorData);
            return null;
        }

        const loginData = await loginResponse.json();
        console.log('✅ Login realizado com sucesso');
        
        const token = loginData.session?.access_token;
        if (!token) {
            console.log('❌ Token não encontrado na resposta do login');
            console.log('📋 Estrutura da resposta:', Object.keys(loginData));
            return null;
        }

        console.log('🎫 Token obtido:', token.substring(0, 50) + '...');
        
        // Testar o token com a API de atividades regionais
        console.log('\n2. Testando token com /api/regional-activities...');
        const activitiesResponse = await fetch('http://localhost:4000/api/regional-activities', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Status da API de atividades:', activitiesResponse.status);
        
        if (!activitiesResponse.ok) {
            const errorData = await activitiesResponse.text();
            console.log('❌ Erro na API de atividades:', errorData);
            return null;
        }

        const activitiesData = await activitiesResponse.json();
        console.log('✅ API de atividades funcionando');
        console.log('📊 Total de atividades retornadas:', Array.isArray(activitiesData) ? activitiesData.length : 'Não é array');
        
        if (Array.isArray(activitiesData)) {
            // Filtrar atividades de "Famílias Embarcadas Decolagem"
            const familiasEmbarcadas = activitiesData.filter(activity => {
                const label = activity.atividade_label || '';
                return label.toLowerCase().includes('famílias embarcadas decolagem');
            });
            
            console.log('👨‍👩‍👧‍👦 Famílias Embarcadas encontradas:', familiasEmbarcadas.length);
            
            if (familiasEmbarcadas.length > 0) {
                const total = familiasEmbarcadas.reduce((sum, activity) => {
                    const quantidade = activity.quantidade || activity.qtd || 0;
                    return sum + (isNaN(quantidade) ? 0 : quantidade);
                }, 0);
                
                console.log('🧮 Total de famílias embarcadas:', total);
                
                console.log('\n📋 Detalhes das atividades:');
                familiasEmbarcadas.forEach((activity, index) => {
                    console.log(`   ${index + 1}. ID: ${activity.id}`);
                    console.log(`      Label: "${activity.atividade_label}"`);
                    console.log(`      Quantidade: ${activity.quantidade || activity.qtd || 0}`);
                    console.log(`      Regional: ${activity.regional}`);
                    console.log('');
                });
            }
        }
        
        return token;
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
        return null;
    }
}

// Executar
getValidToken();