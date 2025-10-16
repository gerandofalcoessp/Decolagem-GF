// Script para verificar as chamadas de API do frontend
console.log('🔍 Verificando chamadas de API do frontend...\n');

// Interceptar todas as chamadas fetch
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    console.log('📡 Chamada fetch interceptada:');
    console.log('   URL:', url);
    console.log('   Method:', options.method || 'GET');
    console.log('   Headers:', options.headers);
    console.log('   Body:', options.body);
    
    return originalFetch.apply(this, args)
        .then(response => {
            console.log('✅ Resposta recebida:');
            console.log('   Status:', response.status);
            console.log('   StatusText:', response.statusText);
            console.log('   Headers:', Object.fromEntries(response.headers.entries()));
            
            // Clone a resposta para poder ler o body
            const clonedResponse = response.clone();
            clonedResponse.text().then(text => {
                console.log('   Body preview:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
            }).catch(err => {
                console.log('   Body read error:', err.message);
            });
            
            return response;
        })
        .catch(error => {
            console.error('❌ Erro na chamada fetch:');
            console.error('   URL:', url);
            console.error('   Error:', error.message);
            throw error;
        });
};

// Verificar localStorage
console.log('🔐 Verificando autenticação no localStorage:');
const authKeys = ['auth_token', 'access_token', 'token', 'user', 'session'];
authKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
        console.log(`   ${key}:`, value.substring(0, 50) + (value.length > 50 ? '...' : ''));
    } else {
        console.log(`   ${key}: null`);
    }
});

// Verificar se há erros no console
console.log('\n🚨 Monitorando erros do console...');
const originalError = console.error;
console.error = function(...args) {
    console.log('❌ ERRO DETECTADO:', ...args);
    originalError.apply(console, args);
};

const originalWarn = console.warn;
console.warn = function(...args) {
    console.log('⚠️ WARNING DETECTADO:', ...args);
    originalWarn.apply(console, args);
};

console.log('\n✅ Monitoramento ativo. Navegue para o dashboard para ver as chamadas de API.');