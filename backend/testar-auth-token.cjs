const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testarAuthToken() {
    try {
        console.log('🔐 Testando autenticação e endpoint /api/instituicoes/stats...\n');
        
        // Primeiro, vamos fazer login para obter um token válido
        console.log('1. Fazendo login para obter token...');
        
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
        
        if (!loginResponse.ok) {
            const errorText = await loginResponse.text();
            console.log('❌ Erro no login:', loginResponse.status, errorText);
            return;
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Login realizado com sucesso');
        
        const token = loginData.session?.access_token;
        if (!token) {
            console.log('❌ Token não encontrado na resposta do login');
            console.log('Resposta do login:', JSON.stringify(loginData, null, 2));
            return;
        }
        
        console.log(`✅ Token obtido: ${token.substring(0, 20)}...`);
        
        // Agora testar o endpoint /api/instituicoes/stats com o token
        console.log('\n2. Testando endpoint /api/instituicoes/stats com token...');
        
        const statsResponse = await fetch('http://localhost:4000/api/instituicoes/stats', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log(`Status: ${statsResponse.status}`);
        
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('✅ Resposta do endpoint stats:');
            console.log(JSON.stringify(statsData, null, 2));
            
            if (statsData.data && statsData.data.resumo) {
                const familiasEmbarcadas = statsData.data.resumo.familiasEmbarcadas;
                console.log(`\n📊 Famílias Embarcadas: ${familiasEmbarcadas}`);
                
                if (familiasEmbarcadas === 2020) {
                    console.log('✅ Valor correto! (2020)');
                } else {
                    console.log(`❌ Valor incorreto. Esperado: 2020, Recebido: ${familiasEmbarcadas}`);
                }
            } else {
                console.log('❌ Estrutura de dados inesperada na resposta');
            }
        } else {
            const errorText = await statsResponse.text();
            console.log('❌ Erro na resposta do stats:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Erro ao testar:', error.message);
    }
}

testarAuthToken();