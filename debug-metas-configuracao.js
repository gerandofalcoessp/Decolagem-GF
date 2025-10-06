// Script para debugar as metas na página de configuração
console.log('🔍 Debugando metas na página de configuração...');

// Verificar se estamos na página correta
if (window.location.pathname !== '/configuracoes') {
  console.log('❌ Não estamos na página de configurações');
  console.log('URL atual:', window.location.pathname);
  console.log('💡 Navegue para /configuracoes e clique na aba "Metas"');
} else {
  console.log('✅ Estamos na página de configurações');
  
  // Verificar se a aba Metas está ativa
  setTimeout(() => {
    const metasTab = document.querySelector('[role="tab"][aria-selected="true"]');
    if (metasTab && metasTab.textContent.includes('Metas')) {
      console.log('✅ Aba Metas está ativa');
    } else {
      console.log('⚠️ Aba Metas não está ativa. Clique na aba "Metas" para continuar o debug');
    }
  }, 500);
}

// Verificar se há token de autenticação
const token = localStorage.getItem('auth_token');
if (!token) {
  console.log('❌ Não há token de autenticação no localStorage');
} else {
  console.log('✅ Token de autenticação encontrado:', token.substring(0, 50) + '...');
}

// Verificar se há dados de metas no React Query cache
if (window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('✅ React Query disponível');
  
  // Tentar acessar o cache do React Query
  setTimeout(() => {
    try {
      const queryClient = window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__.queryClient;
      if (queryClient) {
        const goalsQuery = queryClient.getQueryData(['goals']);
        console.log('📦 Dados de metas no cache:', goalsQuery);
        
        if (goalsQuery && Array.isArray(goalsQuery)) {
          console.log('📊 Número de metas no cache:', goalsQuery.length);
          if (goalsQuery.length > 0) {
            console.log('🎯 Primeira meta:', goalsQuery[0]);
          }
        }
      }
    } catch (error) {
      console.log('❌ Erro ao acessar React Query cache:', error);
    }
  }, 1000);
} else {
  console.log('❌ React Query não disponível');
}

// Verificar elementos DOM relacionados às metas
setTimeout(() => {
  console.log('🔍 Verificando elementos DOM...');
  
  // Procurar por elementos que indicam carregamento
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
  if (loadingElements.length > 0) {
    console.log('⏳ Elementos de loading encontrados:', loadingElements.length);
  }
  
  // Procurar por elementos de erro
  const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
  if (errorElements.length > 0) {
    console.log('❌ Elementos de erro encontrados:', errorElements.length);
  }
  
  // Procurar por cards de metas
  const metaCards = document.querySelectorAll('[class*="meta"], [class*="goal"], [class*="card"]');
  console.log('📋 Elementos que podem ser cards de metas:', metaCards.length);
  
  // Procurar por texto específico
  const bodyText = document.body.innerText;
  if (bodyText.includes('Nenhuma meta criada')) {
    console.log('📝 Texto "Nenhuma meta criada" encontrado na página');
  }
  if (bodyText.includes('Carregando metas')) {
    console.log('⏳ Texto "Carregando metas" encontrado na página');
  }
  if (bodyText.includes('Erro ao carregar metas')) {
    console.log('❌ Texto "Erro ao carregar metas" encontrado na página');
  }
  
  // Verificar se há metas visíveis
  const metasText = bodyText.match(/(\d+)\s*metas?/i);
  if (metasText) {
    console.log('📊 Texto sobre quantidade de metas encontrado:', metasText[0]);
  }
  
}, 2000);

// Interceptar requisições fetch para a API de metas
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string' && url.includes('/goals')) {
    console.log('🌐 Requisição para API de metas interceptada:', url);
    
    return originalFetch.apply(this, args).then(response => {
      console.log('📥 Resposta da API de metas:', response.status, response.statusText);
      
      // Clonar a resposta para poder ler o conteúdo
      const clonedResponse = response.clone();
      clonedResponse.json().then(data => {
        console.log('📦 Dados da API de metas:', data);
        if (data.data && Array.isArray(data.data)) {
          console.log('📊 Número de metas retornadas:', data.data.length);
        }
      }).catch(err => {
        console.log('❌ Erro ao parsear JSON da API de metas:', err);
      });
      
      return response;
    }).catch(error => {
      console.log('❌ Erro na requisição para API de metas:', error);
      throw error;
    });
  }
  
  return originalFetch.apply(this, args);
};

console.log('✅ Debug script carregado. Aguardando atividade...');