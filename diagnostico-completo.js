// DIAGNÓSTICO COMPLETO DO APLICATIVO DECOLAGEM GF
// Execute este script no console do navegador (F12 → Console)

console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DO APLICATIVO');
console.log('================================================');

// 1. VERIFICAR INFORMAÇÕES BÁSICAS
console.log('\n📋 1. INFORMAÇÕES BÁSICAS');
console.log('URL atual:', window.location.href);
console.log('User Agent:', navigator.userAgent);
console.log('Timestamp:', new Date().toISOString());

// 2. VERIFICAR REACT E REACT QUERY
console.log('\n⚛️ 2. VERIFICAÇÃO DO REACT E REACT QUERY');
try {
  if (window.React) {
    console.log('✅ React encontrado:', window.React.version || 'versão não detectada');
  } else {
    console.log('❌ React não encontrado no window');
  }

  // Verificar React Query
  if (window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__) {
    const queryClient = window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__.queryClient;
    if (queryClient) {
      console.log('✅ React Query encontrado');
      const queries = queryClient.getQueryCache().getAll();
      console.log('📊 Total de queries no cache:', queries.length);
      
      // Listar todas as queries
      queries.forEach(query => {
        console.log(`  - Query: ${JSON.stringify(query.queryKey)}, Status: ${query.state.status}, Data:`, query.state.data);
      });
    }
  } else {
    console.log('❌ React Query DevTools não encontrado');
  }
} catch (error) {
  console.log('❌ Erro ao verificar React/React Query:', error);
}

// 3. VERIFICAR AUTENTICAÇÃO
console.log('\n🔐 3. VERIFICAÇÃO DE AUTENTICAÇÃO');
const token = localStorage.getItem('auth_token');
const user = localStorage.getItem('user');
console.log('Token presente:', !!token);
console.log('Dados do usuário:', user ? JSON.parse(user) : 'Não encontrado');

// 4. VERIFICAR CONECTIVIDADE COM BACKEND
console.log('\n🌐 4. TESTE DE CONECTIVIDADE COM BACKEND');
const API_BASE_URL = 'http://localhost:3000';

async function testEndpoint(endpoint, description) {
  try {
    console.log(`🔄 Testando ${description}...`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ ${description} funcionando - Dados:`, data);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.log(`  ❌ ${description} com erro:`, errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log(`  ❌ Erro de rede em ${description}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Testar endpoints principais
const endpoints = [
  { path: '/auth/me', desc: 'Autenticação' },
  { path: '/members', desc: 'Membros' },
  { path: '/goals', desc: 'Metas' },
  { path: '/auth/users', desc: 'Usuários' },
  { path: '/decolagem', desc: 'Decolagem' },
  { path: '/asmaras', desc: 'As Maras' },
  { path: '/microcredito', desc: 'Microcrédito' }
];

Promise.all(endpoints.map(ep => testEndpoint(ep.path, ep.desc)))
  .then(results => {
    console.log('\n📊 RESUMO DOS TESTES DE API:');
    results.forEach((result, index) => {
      const endpoint = endpoints[index];
      console.log(`  ${result.success ? '✅' : '❌'} ${endpoint.desc}: ${result.success ? 'OK' : result.error}`);
    });
  });

// 5. VERIFICAR ELEMENTOS DA PÁGINA
console.log('\n🎨 5. VERIFICAÇÃO DOS ELEMENTOS DA PÁGINA');
setTimeout(() => {
  // Verificar elementos principais
  const elements = {
    'Header/Navigation': 'header, nav, [role="navigation"]',
    'Main Content': 'main, [role="main"], .main-content',
    'Loading Indicators': '[data-testid*="loading"], .loading, [class*="loading"]',
    'Error Messages': '[data-testid*="error"], .error, [class*="error"]',
    'Forms': 'form',
    'Buttons': 'button',
    'Tables': 'table',
    'Cards': '[class*="card"], .card'
  };

  Object.entries(elements).forEach(([name, selector]) => {
    const found = document.querySelectorAll(selector);
    console.log(`  ${name}: ${found.length} elementos encontrados`);
  });

  // Verificar se há erros visíveis
  const errorElements = document.querySelectorAll('[class*="error"], .error, [data-testid*="error"]');
  if (errorElements.length > 0) {
    console.log('⚠️ ERROS VISÍVEIS ENCONTRADOS:');
    errorElements.forEach((el, index) => {
      console.log(`  ${index + 1}. ${el.textContent || el.innerHTML}`);
    });
  }
}, 1000);

// 6. VERIFICAR CONSOLE ERRORS
console.log('\n🐛 6. VERIFICAÇÃO DE ERROS NO CONSOLE');
const originalError = console.error;
const originalWarn = console.warn;
const errors = [];
const warnings = [];

console.error = function(...args) {
  errors.push(args);
  originalError.apply(console, args);
};

console.warn = function(...args) {
  warnings.push(args);
  originalWarn.apply(console, args);
};

// Restaurar após 5 segundos
setTimeout(() => {
  console.error = originalError;
  console.warn = originalWarn;
  
  console.log('\n📊 RESUMO DE ERROS E AVISOS CAPTURADOS:');
  console.log(`Erros: ${errors.length}`);
  console.log(`Avisos: ${warnings.length}`);
  
  if (errors.length > 0) {
    console.log('🔴 ERROS:');
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}.`, error);
    });
  }
  
  if (warnings.length > 0) {
    console.log('🟡 AVISOS:');
    warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}.`, warning);
    });
  }
}, 5000);

// 7. VERIFICAR PERFORMANCE
console.log('\n⚡ 7. VERIFICAÇÃO DE PERFORMANCE');
if (window.performance) {
  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation) {
    console.log('Tempo de carregamento da página:', Math.round(navigation.loadEventEnd - navigation.fetchStart), 'ms');
    console.log('Tempo até DOM pronto:', Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart), 'ms');
  }
  
  const resources = performance.getEntriesByType('resource');
  console.log('Total de recursos carregados:', resources.length);
  
  const slowResources = resources.filter(r => r.duration > 1000);
  if (slowResources.length > 0) {
    console.log('⚠️ Recursos lentos (>1s):');
    slowResources.forEach(r => {
      console.log(`  ${r.name}: ${Math.round(r.duration)}ms`);
    });
  }
}

// 8. VERIFICAR STORAGE
console.log('\n💾 8. VERIFICAÇÃO DE STORAGE');
console.log('LocalStorage items:', Object.keys(localStorage).length);
Object.keys(localStorage).forEach(key => {
  const value = localStorage.getItem(key);
  console.log(`  ${key}: ${value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : 'null'}`);
});

console.log('SessionStorage items:', Object.keys(sessionStorage).length);
Object.keys(sessionStorage).forEach(key => {
  const value = sessionStorage.getItem(key);
  console.log(`  ${key}: ${value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : 'null'}`);
});

console.log('\n✅ DIAGNÓSTICO COMPLETO FINALIZADO');
console.log('================================================');
console.log('⏰ Aguarde 5 segundos para ver o resumo final de erros e avisos');