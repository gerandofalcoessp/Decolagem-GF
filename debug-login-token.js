const fetch = require('node-fetch');

async function debugLoginToken() {
    console.log('🔍 Analisando resposta do login...\n');

    try {
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

        console.log(`📡 Status do login: ${loginResponse.status}`);
        
        if (loginResponse.status !== 200) {
            const errorText = await loginResponse.text();
            console.error('❌ Erro no login:', errorText);
            return;
        }

        const loginData = await loginResponse.json();
        console.log('✅ Login realizado com sucesso');
        console.log('📋 Estrutura completa da resposta do login:');
        console.log(JSON.stringify(loginData, null, 2));

        // Tentar diferentes formas de extrair o token
        const possibleTokens = {
            'access_token': loginData.access_token,
            'token': loginData.token,
            'authToken': loginData.authToken,
            'jwt': loginData.jwt,
            'bearer': loginData.bearer,
            'user.access_token': loginData.user?.access_token,
            'user.token': loginData.user?.token,
            'session.access_token': loginData.session?.access_token,
            'session.token': loginData.session?.token
        };

        console.log('\n🔑 Possíveis tokens encontrados:');
        Object.entries(possibleTokens).forEach(([key, value]) => {
            if (value) {
                console.log(`   - ${key}: ${value.substring(0, 50)}...`);
            }
        });

        // Usar o primeiro token válido encontrado
        const token = Object.values(possibleTokens).find(t => t && typeof t === 'string');
        
        if (!token) {
            console.error('❌ Nenhum token encontrado na resposta');
            return;
        }

        console.log(`\n🎫 Usando token: ${token.substring(0, 50)}...`);

        // Testar o token
        console.log('\n2. Testando token com /api/regional-activities...');
        const activitiesResponse = await fetch('http://localhost:4000/api/regional-activities', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`📡 Status da API de atividades: ${activitiesResponse.status}`);
        
        if (activitiesResponse.status === 200) {
            const activities = await activitiesResponse.json();
            console.log(`✅ API funcionando! Total de atividades: ${activities.length}`);
        } else {
            const errorText = await activitiesResponse.text();
            console.error('❌ Erro na API:', errorText);
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

debugLoginToken();