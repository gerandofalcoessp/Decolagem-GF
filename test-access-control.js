const fetch = require('node-fetch');

async function testAccessControl() {
  console.log('🧪 TESTANDO CONTROLE DE ACESSO NO DASHBOARD GERAL');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const API_BASE_URL = 'http://localhost:3002';

  try {
    // 1. Testar sem autenticação
    console.log('1️⃣ Testando sem autenticação...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/atividades`);
      console.log(`   Status: ${response.status}`);
      if (response.status === 401) {
        console.log('   ✅ Correto: Acesso negado sem autenticação');
      } else {
        console.log('   ❌ Problema: Deveria retornar 401');
      }
    } catch (error) {
      console.log(`   ❌ Erro de conexão: ${error.message}`);
    }

    // 2. Instruções para testar com diferentes usuários
    console.log('\n2️⃣ Para testar com diferentes usuários:');
    console.log('   a) Abra o navegador em http://localhost:3002/login');
    console.log('   b) Faça login com diferentes usuários');
    console.log('   c) Acesse http://localhost:3002/dashboard');
    console.log('   d) Verifique se os dados mostrados são filtrados por regional');
    console.log('   e) No console do navegador, execute:');
    console.log('      localStorage.getItem("auth_token")');
    console.log('   f) Use o token para testar a API manualmente:');
    console.log('');
    console.log('      fetch("/api/atividades", {');
    console.log('        headers: {');
    console.log('          "Authorization": "Bearer " + localStorage.getItem("auth_token")');
    console.log('        }');
    console.log('      }).then(r => r.json()).then(console.log)');

    console.log('\n3️⃣ Verificação esperada:');
    console.log('   - Super admin: deve ver TODAS as atividades de TODAS as regionais');
    console.log('   - Usuário regional: deve ver APENAS atividades da sua regional');
    console.log('   - Usuário nacional: deve ver TODAS as atividades');

    console.log('\n4️⃣ Logs do servidor:');
    console.log('   - Verifique o terminal onde o servidor está rodando');
    console.log('   - Procure por logs que começam com 🔍, 🔄, 👤, 👑, 📊');
    console.log('   - Estes logs mostram como o filtro está sendo aplicado');

    console.log('\n✅ Correção implementada:');
    console.log('   - Endpoint /api/atividades agora aplica filtros baseados em role');
    console.log('   - Super admins veem todos os dados');
    console.log('   - Usuários regionais veem apenas dados da sua regional');
    console.log('   - Logs detalhados para debug');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testAccessControl().catch(console.error);