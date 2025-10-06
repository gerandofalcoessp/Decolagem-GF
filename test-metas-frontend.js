// Script para testar as metas diretamente no frontend
console.log('🔍 Testando metas no frontend...');

// Função para aguardar elemento aparecer
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Elemento ${selector} não encontrado em ${timeout}ms`));
    }, timeout);
  });
}

// Verificar se estamos na página correta
if (window.location.pathname !== '/configuracoes') {
  console.log('❌ Não estamos na página de configurações');
  console.log('URL atual:', window.location.pathname);
  console.log('💡 Navegue para /configuracoes primeiro');
} else {
  console.log('✅ Estamos na página de configurações');
  
  // Aguardar e clicar na aba Metas
  setTimeout(async () => {
    try {
      console.log('🔍 Procurando pela aba Metas...');
      
      // Procurar por diferentes seletores possíveis para a aba Metas
      const possibleSelectors = [
        '[role="tab"]:contains("Metas")',
        'button:contains("Metas")',
        '[data-tab="metas"]',
        '.tab-metas',
        'div[role="tablist"] button'
      ];
      
      let metasTab = null;
      
      // Procurar por texto "Metas" em todos os botões/tabs
      const allButtons = document.querySelectorAll('button, [role="tab"], .tab');
      for (const button of allButtons) {
        if (button.textContent && button.textContent.toLowerCase().includes('metas')) {
          metasTab = button;
          break;
        }
      }
      
      if (metasTab) {
        console.log('✅ Aba Metas encontrada:', metasTab);
        console.log('📝 Texto da aba:', metasTab.textContent);
        
        // Clicar na aba
        metasTab.click();
        console.log('🖱️ Clicou na aba Metas');
        
        // Aguardar conteúdo carregar
        setTimeout(() => {
          console.log('🔍 Verificando conteúdo das metas...');
          
          // Verificar se há elementos de loading
          const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
          if (loadingElements.length > 0) {
            console.log('⏳ Elementos de loading encontrados:', loadingElements.length);
          }
          
          // Verificar se há elementos de erro
          const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
          if (errorElements.length > 0) {
            console.log('❌ Elementos de erro encontrados:', errorElements.length);
            errorElements.forEach((el, i) => {
              console.log(`Erro ${i + 1}:`, el.textContent);
            });
          }
          
          // Verificar se há cards de metas
          const metaCards = document.querySelectorAll('[class*="meta"], [class*="goal"], [class*="card"]');
          console.log('📋 Possíveis cards de metas encontrados:', metaCards.length);
          
          // Verificar texto específico
          const bodyText = document.body.innerText;
          if (bodyText.includes('Nenhuma meta criada')) {
            console.log('📝 ✅ Texto "Nenhuma meta criada" encontrado');
          }
          if (bodyText.includes('Carregando metas')) {
            console.log('⏳ Texto "Carregando metas" encontrado');
          }
          if (bodyText.includes('Erro ao carregar metas')) {
            console.log('❌ Texto "Erro ao carregar metas" encontrado');
          }
          
          // Verificar se há dados no React Query
          if (window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__) {
            try {
              const queryClient = window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__.queryClient;
              if (queryClient) {
                const goalsQuery = queryClient.getQueryData(['goals']);
                console.log('📦 Dados de metas no React Query:', goalsQuery);
                
                if (goalsQuery && Array.isArray(goalsQuery)) {
                  console.log('📊 Número de metas no cache:', goalsQuery.length);
                  if (goalsQuery.length > 0) {
                    console.log('🎯 Primeira meta:', goalsQuery[0]);
                  }
                }
              }
            } catch (error) {
              console.log('❌ Erro ao acessar React Query:', error);
            }
          }
          
          // Listar todos os elementos visíveis na aba atual
          const visibleElements = Array.from(document.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
          });
          
          console.log('👁️ Elementos visíveis na página:', visibleElements.length);
          
          // Procurar especificamente por elementos com texto relacionado a metas
          const metaTexts = [];
          visibleElements.forEach(el => {
            const text = el.textContent?.toLowerCase() || '';
            if (text.includes('meta') && el.children.length === 0) { // Apenas elementos folha
              metaTexts.push(el.textContent);
            }
          });
          
          if (metaTexts.length > 0) {
            console.log('📝 Textos relacionados a metas encontrados:', metaTexts);
          }
          
        }, 2000);
        
      } else {
        console.log('❌ Aba Metas não encontrada');
        console.log('🔍 Botões/tabs disponíveis:');
        allButtons.forEach((btn, i) => {
          console.log(`  ${i + 1}. "${btn.textContent?.trim()}" (${btn.tagName})`);
        });
      }
      
    } catch (error) {
      console.log('❌ Erro ao procurar aba Metas:', error);
    }
  }, 1000);
}

console.log('✅ Script de teste carregado. Aguardando execução...');