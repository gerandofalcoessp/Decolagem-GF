// Script para ser executado no console do navegador
// Copie e cole este código no console do navegador na página http://localhost:3001/configuracoes

console.log('🔍 === DEBUG METAS FRONTEND ===');

// 1. Verificar URL atual
console.log('📍 URL atual:', window.location.href);

// 2. Verificar localStorage
console.log('💾 === VERIFICANDO LOCALSTORAGE ===');
const authToken = localStorage.getItem('auth_token');
const refreshToken = localStorage.getItem('refresh_token');
const authStorage = localStorage.getItem('auth-storage');

console.log('🔑 Auth Token:', authToken ? `Presente (${authToken.substring(0, 50)}...)` : 'AUSENTE');
console.log('🔄 Refresh Token:', refreshToken ? 'Presente' : 'AUSENTE');
console.log('📦 Auth Storage:', authStorage ? 'Presente' : 'AUSENTE');

if (authStorage) {
    try {
        const parsedAuth = JSON.parse(authStorage);
        console.log('👤 Usuário no storage:', parsedAuth);
    } catch (e) {
        console.error('❌ Erro ao parsear auth-storage:', e);
    }
}

// 3. Verificar se está na página de configurações
console.log('🏠 === VERIFICANDO PÁGINA ===');
const isConfigPage = window.location.pathname === '/configuracoes';
console.log('📄 Está na página de configurações:', isConfigPage);

// 4. Verificar se a aba de metas está ativa
console.log('📑 === VERIFICANDO ABA METAS ===');
const metasTab = document.querySelector('[data-testid="metas-tab"], [role="tab"]:has-text("Metas"), button:contains("Metas")');
const metasTabActive = document.querySelector('[data-testid="metas-tab"][aria-selected="true"], [role="tab"][aria-selected="true"]:has-text("Metas")');

console.log('🎯 Aba Metas encontrada:', !!metasTab);
console.log('✅ Aba Metas ativa:', !!metasTabActive);

// 5. Verificar elementos da interface de metas
console.log('🎨 === VERIFICANDO ELEMENTOS DA INTERFACE ===');
const loadingElement = document.querySelector('[data-testid="metas-loading"], .loading, [class*="loading"]');
const errorElement = document.querySelector('[data-testid="metas-error"], .error, [class*="error"]');
const noMetasElement = document.querySelector('[data-testid="no-metas"], [class*="no-metas"]');
const metasContainer = document.querySelector('[data-testid="metas-container"], [class*="metas-container"]');
const metaCards = document.querySelectorAll('[data-testid="meta-card"], [class*="meta-card"], .meta-item');

console.log('⏳ Loading element:', !!loadingElement);
console.log('❌ Error element:', !!errorElement);
console.log('📭 No metas element:', !!noMetasElement);
console.log('📦 Metas container:', !!metasContainer);
console.log('🎴 Meta cards:', metaCards.length);

// 6. Verificar React Query cache (se disponível)
console.log('🗄️ === VERIFICANDO REACT QUERY CACHE ===');
try {
    // Tentar acessar o cache do React Query
    const queryClient = window.__REACT_QUERY_CLIENT__ || window.queryClient;
    if (queryClient) {
        const cache = queryClient.getQueryCache();
        const queries = cache.getAll();
        console.log('📊 Total de queries no cache:', queries.length);
        
        const goalsQuery = queries.find(q => q.queryKey.includes('goals') || q.queryKey.includes('metas'));
        if (goalsQuery) {
            console.log('🎯 Query de metas encontrada:', goalsQuery);
            console.log('📊 Estado da query:', goalsQuery.state);
            console.log('📈 Dados da query:', goalsQuery.state.data);
        } else {
            console.log('❌ Query de metas não encontrada no cache');
        }
    } else {
        console.log('❌ React Query Client não encontrado');
    }
} catch (e) {
    console.log('❌ Erro ao acessar React Query cache:', e.message);
}

// 7. Fazer teste manual da API
console.log('🌐 === TESTE MANUAL DA API ===');
if (authToken) {
    fetch('http://localhost:4000/goals', {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('📡 Status da API:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('📊 Dados da API:', data);
        if (data.data && Array.isArray(data.data)) {
            console.log('🎯 Total de metas da API:', data.data.length);
        }
    })
    .catch(error => {
        console.error('❌ Erro na API:', error);
    });
} else {
    console.log('❌ Não é possível testar API - token ausente');
}

// 8. Verificar erros no console
console.log('🚨 === VERIFICANDO ERROS ===');
console.log('💡 Verifique se há erros vermelhos no console acima desta mensagem');

console.log('✅ === DEBUG CONCLUÍDO ===');
console.log('📋 Próximos passos:');
console.log('1. Se não há token, faça login primeiro');
console.log('2. Se há token mas não há dados, verifique a API');
console.log('3. Se há dados da API mas não aparecem na tela, verifique os componentes React');