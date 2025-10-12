const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testarEndpoint() {
    try {
        console.log('Testando endpoint /api/instituicoes/stats...');
        
        const response = await fetch('http://localhost:4000/api/instituicoes/stats', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Resposta do endpoint:', JSON.stringify(data, null, 2));
            
            if (data.familiasEmbarcadas !== undefined) {
                console.log(`\nFamílias Embarcadas: ${data.familiasEmbarcadas}`);
                if (data.familiasEmbarcadas === 2020) {
                    console.log('✅ Valor correto! (2020)');
                } else {
                    console.log('❌ Valor incorreto. Esperado: 2020');
                }
            }
        } else {
            const errorText = await response.text();
            console.log('Erro na resposta:', errorText);
        }
        
    } catch (error) {
        console.error('Erro ao testar endpoint:', error.message);
    }
}

testarEndpoint();