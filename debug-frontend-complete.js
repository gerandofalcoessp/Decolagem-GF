const puppeteer = require('puppeteer');

async function debugFrontend() {
  console.log('🔍 Debugando frontend completo...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capturar logs do console
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`🖥️  CONSOLE [${type.toUpperCase()}]: ${text}`);
  });
  
  // Capturar erros
  page.on('pageerror', error => {
    console.log(`❌ ERRO DA PÁGINA: ${error.message}`);
  });
  
  // Capturar requisições de rede
  page.on('request', request => {
    if (request.url().includes('/goals') || request.url().includes('/login')) {
      console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
    }
  });
  
  // Capturar respostas de rede
  page.on('response', response => {
    if (response.url().includes('/goals') || response.url().includes('/login')) {
      console.log(`📨 RESPONSE: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('1. Navegando para o frontend...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    console.log('2. Aguardando carregamento inicial...');
    await page.waitForTimeout(3000);
    
    // Verificar se está na página de login
    const isLoginPage = await page.$('input[type="email"]');
    if (isLoginPage) {
      console.log('3. Fazendo login...');
      await page.type('input[type="email"]', 'teste@decolagem.com');
      await page.type('input[type="password"]', '123456');
      
      // Clicar no botão de login
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    
    console.log('4. Verificando se está logado...');
    const currentUrl = page.url();
    console.log(`   URL atual: ${currentUrl}`);
    
    // Tentar navegar para dashboard de metas
    console.log('5. Navegando para dashboard de metas...');
    try {
      await page.goto('http://localhost:3000/dashboard/metas', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(5000);
      
      console.log('6. Verificando elementos na página...');
      
      // Verificar se há elementos de loading
      const loadingElements = await page.$$('[data-testid*="loading"], .loading, .spinner');
      console.log(`   Elementos de loading encontrados: ${loadingElements.length}`);
      
      // Verificar se há elementos de erro
      const errorElements = await page.$$('[data-testid*="error"], .error');
      console.log(`   Elementos de erro encontrados: ${errorElements.length}`);
      
      // Verificar se há elementos de metas
      const goalElements = await page.$$('[data-testid*="goal"], [data-testid*="meta"], .goal, .meta');
      console.log(`   Elementos de metas encontrados: ${goalElements.length}`);
      
      // Verificar texto da página
      const pageText = await page.evaluate(() => document.body.innerText);
      console.log('7. Conteúdo da página:');
      console.log(pageText.substring(0, 500) + '...');
      
      // Verificar se há dados no localStorage
      const localStorage = await page.evaluate(() => {
        const data = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          data[key] = window.localStorage.getItem(key);
        }
        return data;
      });
      console.log('8. LocalStorage:', JSON.stringify(localStorage, null, 2));
      
      // Verificar se há dados no sessionStorage
      const sessionStorage = await page.evaluate(() => {
        const data = {};
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i);
          data[key] = window.sessionStorage.getItem(key);
        }
        return data;
      });
      console.log('9. SessionStorage:', JSON.stringify(sessionStorage, null, 2));
      
      // Aguardar mais um pouco para ver se algo carrega
      console.log('10. Aguardando carregamento adicional...');
      await page.waitForTimeout(10000);
      
      // Verificar novamente os elementos
      const finalGoalElements = await page.$$('[data-testid*="goal"], [data-testid*="meta"], .goal, .meta');
      console.log(`    Elementos de metas após espera: ${finalGoalElements.length}`);
      
    } catch (error) {
      console.log(`❌ Erro ao navegar para dashboard de metas: ${error.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro geral: ${error.message}`);
  }
  
  console.log('\n11. Mantendo navegador aberto para inspeção manual...');
  console.log('    Pressione Ctrl+C para fechar quando terminar a inspeção.');
  
  // Manter o navegador aberto
  await new Promise(() => {});
}

debugFrontend().catch(console.error);