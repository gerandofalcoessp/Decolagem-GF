// Script para testar comportamento de navegação e persistência de metas
// Execute no console do navegador

console.log('🔍 Testando comportamento de navegação e persistência de metas...');

// 1. Verificar se há token no localStorage
const token = localStorage.getItem('auth_token');
console.log('🔑 Token no localStorage:', token ? 'Presente' : 'Ausente');

if (token) {
  console.log('🔑 Token:', token.substring(0, 20) + '...');
}

// 2. Verificar se há dados de usuário no localStorage
const userData = localStorage.getItem('user_data');
console.log('👤 Dados do usuário:', userData ? 'Presentes' : 'Ausentes');

// 3. Testar chamada direta para a API de metas
async function testGoalsAPI() {
  console.log('📡 Testando chamada direta para API de metas...');
  
  if (!token) {
    console.error('❌ Não é possível testar API sem token');
    return;
  }

  try {
    const response = await fetch('http://localhost:4000/goals', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Status da resposta:', response.status);
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📦 Dados recebidos da API:', result);
    
    // Verificar se há metas
    const goals = result.data || result;
    console.log('🎯 Número de metas encontradas:', Array.isArray(goals) ? goals.length : 0);
    
    if (Array.isArray(goals) && goals.length > 0) {
      console.log('🎯 Primeira meta:', goals[0]);
    }
    
  } catch (error) {
    console.error('❌ Erro ao chamar API de metas:', error);
  }
}

// 4. Verificar estado atual do React (se disponível)
function checkReactState() {
  console.log('⚛️ Verificando estado do React...');
  
  // Tentar acessar o React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('⚛️ React DevTools detectado');
  }
  
  // Verificar se há componentes React na página
  const reactElements = document.querySelectorAll('[data-reactroot], [data-react-checksum]');
  console.log('⚛️ Elementos React encontrados:', reactElements.length);
}

// Executar testes
testGoalsAPI();
checkReactState();

// 5. Simular navegação e verificar persistência
console.log('🧪 Para testar navegação:');
console.log('1. Vá para /dashboard/metas');
console.log('2. Verifique se as metas aparecem');
console.log('3. Navegue para outra página (ex: /dashboard)');
console.log('4. Volte para /dashboard/metas');
console.log('5. Execute este script novamente para verificar o estado');

// Função para monitorar mudanças no localStorage
function monitorLocalStorage() {
  console.log('👀 Monitorando mudanças no localStorage...');
  
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;
  const originalClear = localStorage.clear;
  
  localStorage.setItem = function(key, value) {
    console.log('📝 localStorage.setItem:', key, value?.substring(0, 50) + '...');
    return originalSetItem.apply(this, arguments);
  };
  
  localStorage.removeItem = function(key) {
    console.log('🗑️ localStorage.removeItem:', key);
    return originalRemoveItem.apply(this, arguments);
  };
  
  localStorage.clear = function() {
    console.log('🧹 localStorage.clear()');
    return originalClear.apply(this, arguments);
  };
}

// Ativar monitoramento
monitorLocalStorage();

console.log('✅ Script de teste carregado. Monitore o console durante a navegação.');