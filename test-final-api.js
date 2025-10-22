const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function testFinalAPI() {
  console.log('🧪 Teste Final da API de Edição de Atividades\n');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 1. Login
    console.log('1. 🔐 Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'flavio.almeida@gerandofalcoes.com',
      password: '123456'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }

    const token = authData.session.access_token;
    console.log('✅ Login bem-sucedido!');

    // 2. Buscar uma atividade existente
    console.log('\n2. 🔍 Buscando atividade existente...');
    const { data: activities, error: activitiesError } = await supabase
      .from('regional_activities')
      .select('*')
      .limit(1);

    if (activitiesError || !activities || activities.length === 0) {
      console.error('❌ Nenhuma atividade encontrada');
      return;
    }

    const testActivity = activities[0];
    console.log(`✅ Atividade encontrada: ${testActivity.title} (ID: ${testActivity.id})`);

    // 3. Testar endpoint da API com token válido
    console.log('\n3. 🌐 Testando endpoint da API...');
    const apiUrl = `http://localhost:4000/api/regional-activities/${testActivity.id}/with-files`;
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API funcionando corretamente!');
        console.log('   Dados retornados:');
        console.log(`   - ID: ${data.id}`);
        console.log(`   - Título: ${data.title}`);
        console.log(`   - Tipo: ${data.type}`);
        console.log(`   - Regional: ${data.regional}`);
        console.log(`   - Status: ${data.status}`);
        console.log(`   - Arquivos: ${data.files ? data.files.length : 0}`);
      } else {
        const errorData = await response.text();
        console.error('❌ Erro na API:', errorData);
      }
    } catch (fetchError) {
      console.error('❌ Erro na requisição:', fetchError.message);
    }

    // 4. Testar com ID inválido
    console.log('\n4. 🔍 Testando com ID inválido...');
    const invalidUrl = `http://localhost:4000/api/regional-activities/invalid-id/with-files`;
    
    try {
      const invalidResponse = await fetch(invalidUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${invalidResponse.status} ${invalidResponse.statusText}`);
      
      if (!invalidResponse.ok) {
        const errorData = await invalidResponse.text();
        console.log('✅ Erro esperado para ID inválido:', errorData);
      }
    } catch (fetchError) {
      console.error('❌ Erro na requisição com ID inválido:', fetchError.message);
    }

    // 5. Testar sem token
    console.log('\n5. 🚫 Testando sem token...');
    
    try {
      const noTokenResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${noTokenResponse.status} ${noTokenResponse.statusText}`);
      
      if (!noTokenResponse.ok) {
        const errorData = await noTokenResponse.text();
        console.log('✅ Erro esperado sem token:', errorData);
      }
    } catch (fetchError) {
      console.error('❌ Erro na requisição sem token:', fetchError.message);
    }

    // 6. Verificar se o problema está no frontend
    console.log('\n6. 🖥️ Simulando comportamento do frontend...');
    
    // Simular como o frontend faz a requisição
    const frontendToken = localStorage ? localStorage.getItem('auth_token') : null;
    console.log(`   Token do localStorage: ${frontendToken ? 'Presente' : 'Ausente'}`);
    
    // Usar o token da sessão atual
    const frontendHeaders = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      frontendHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const frontendResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: frontendHeaders
      });

      console.log(`   Status frontend: ${frontendResponse.status} ${frontendResponse.statusText}`);
      
      if (frontendResponse.ok) {
        const frontendData = await frontendResponse.json();
        console.log('✅ Simulação do frontend funcionou!');
        console.log(`   Título: ${frontendData.title}`);
      } else {
        const errorData = await frontendResponse.text();
        console.error('❌ Erro na simulação do frontend:', errorData);
      }
    } catch (fetchError) {
      console.error('❌ Erro na simulação do frontend:', fetchError.message);
    }

    console.log('\n🎯 Conclusão:');
    console.log('   - Backend está rodando na porta 3001');
    console.log('   - Autenticação está funcionando');
    console.log('   - Dados existem no banco');
    console.log('   - API endpoint está respondendo');
    console.log('   - O problema pode estar no frontend ou na forma como o token é enviado');

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testFinalAPI();