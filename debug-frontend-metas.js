// Script para debugar metas no frontend - execute no console do navegador
console.log('🔍 Debugando metas no frontend...');

// Verificar se estamos na página correta
console.log('📍 URL atual:', window.location.pathname);

// Verificar token de autenticação
const token = localStorage.getItem('auth_token');
console.log('🔑 Token presente:', !!token);
if (token) {
  console.log('🔑 Token (primeiros 50 chars):', token.substring(0, 50) + '...');
}

// Verificar React Query cache
setTimeout(() => {
  try {
    // Tentar acessar o React Query DevTools
    if (window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('✅ React Query DevTools disponível');
      
      const queryClient = window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__.queryClient;
      if (queryClient) {
        const goalsQuery = queryClient.getQueryData(['goals']);
        console.log('📦 Dados de metas no cache:', goalsQuery);
        
        if (goalsQuery && Array.isArray(goalsQuery)) {
          console.log('📊 Número de metas no cache:', goalsQuery.length);
          if (goalsQuery.length > 0) {
            console.log('🎯 Primeira meta no cache:', goalsQuery[0]);
          }
        } else {
          console.log('❌ Dados de metas não são um array ou estão vazios');
        }
        
        // Verificar estado da query
        const queryState = queryClient.getQueryState(['goals']);
        console.log('📊 Estado da query goals:', queryState);
      }
    } else {
      console.log('❌ React Query DevTools não disponível');
    }
  } catch (error) {
    console.error('❌ Erro ao acessar React Query:', error);
  }
}, 1000);

// Verificar elementos DOM
setTimeout(() => {
  console.log('🔍 Verificando elementos DOM...');
  
  // Procurar por elementos de loading
  const loadingElements = document.querySelectorAll('*[class*="loading"], *[class*="Loading"]');
  console.log('⏳ Elementos de loading:', loadingElements.length);
  
  // Procurar por elementos de erro
  const errorElements = document.querySelectorAll('*[class*="error"], *[class*="Error"]');
  console.log('❌ Elementos de erro:', errorElements.length);
  
  // Procurar por texto "Nenhuma meta criada"
  const noMetasText = document.querySelector('*:contains("Nenhuma meta criada")');
  console.log('📝 Texto "Nenhuma meta criada" encontrado:', !!noMetasText);
  
  // Procurar por cards de metas
  const metaCards = document.querySelectorAll('[class*="grid"] > div');
  console.log('📋 Possíveis cards de metas:', metaCards.length);
  
  // Procurar por botão "Nova Meta"
  const novaMetaButton = document.querySelector('button:contains("Nova Meta")');
  console.log('➕ Botão "Nova Meta" encontrado:', !!novaMetaButton);
  
}, 1500);

// Tentar fazer uma requisição manual para a API
setTimeout(async () => {
  if (token) {
    try {
      console.log('🌐 Fazendo requisição manual para /api/goals...');
      const response = await fetch('http://localhost:3000/api/goals', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📡 Resposta da API:', data);
      
      if (data.data && Array.isArray(data.data)) {
        console.log('📊 Metas retornadas pela API:', data.data.length);
        if (data.data.length > 0) {
          console.log('🎯 Primeira meta da API:', data.data[0]);
        }
      }
    } catch (error) {
      console.error('❌ Erro na requisição manual:', error);
    }
  }
}, 2000);

console.log('✅ Script de debug carregado. Aguarde os resultados...');