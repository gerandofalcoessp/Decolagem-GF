const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function testAuthWithValidCredentials() {
  console.log('🧪 Testando autenticação com credenciais válidas...\n');

  try {
    // 1. Testar login com credenciais encontradas no código
    console.log('1. 🔐 Testando login com credenciais encontradas...');
    
    const possibleCredentials = [
      { email: 'flavio.almeida@gerandofalcoes.com', password: '123456' },
      { email: 'leo.martins@gerandofalcoes.com', password: '123456' },
      { email: 'coord.regional.sp@gerandofalcoes.com', password: '123456' },
      { email: 'superadmin@decolagem.com', password: 'SuperAdmin2024!' },
      { email: 'admin@decolagem.com', password: 'SuperAdmin2024!' }
    ];

    let loginSuccess = false;
    let token = null;
    let userEmail = null;

    for (const cred of possibleCredentials) {
      console.log(`   Tentando: ${cred.email}`);
      
      try {
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cred),
        });

        const loginData = await loginResponse.json();
        
        if (loginResponse.ok) {
          console.log(`   ✅ Login realizado com sucesso!`);
          token = loginData.session?.access_token || loginData.access_token || loginData.token;
          userEmail = cred.email;
          loginSuccess = true;
          console.log(`   Token obtido: ${token ? 'Sim' : 'Não'}`);
          break;
        } else {
          console.log(`   ❌ Falhou: ${loginData.error || 'Credenciais inválidas'}`);
        }
      } catch (error) {
        console.log(`   ❌ Erro na requisição: ${error.message}`);
      }
    }

    if (!loginSuccess) {
      console.error('❌ Não foi possível fazer login com nenhuma credencial');
      return;
    }

    console.log(`\n✅ Login bem-sucedido com: ${userEmail}`);
    console.log(`🔑 Token: ${token.substring(0, 20)}...`);

    // 2. Buscar uma atividade existente no Supabase
    console.log('\n2. 🔍 Buscando atividade existente...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: activities, error: activitiesError } = await supabase
      .from('regional_activities')
      .select('id, title, type, regional')
      .limit(1);

    if (activitiesError) {
      console.error('❌ Erro ao buscar atividades:', activitiesError.message);
      return;
    }

    if (!activities || activities.length === 0) {
      console.log('❌ Nenhuma atividade encontrada');
      return;
    }

    const testActivity = activities[0];
    console.log(`✅ Atividade encontrada: ${testActivity.title} (ID: ${testActivity.id})`);

    // 3. Testar endpoint da API com token válido
    console.log('\n3. 🧪 Testando endpoint da API com token válido...');
    
    try {
      const apiResponse = await fetch(`http://localhost:3001/api/regional-activities/${testActivity.id}/with-files`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const apiData = await apiResponse.json();
      
      console.log(`Status da API: ${apiResponse.status}`);
      
      if (apiResponse.ok) {
        console.log('✅ API funcionando corretamente!');
        console.log(`   Atividade retornada: ${apiData.title}`);
        console.log(`   Tipo: ${apiData.type}`);
        console.log(`   Regional: ${apiData.regional}`);
        console.log(`   Evidências: ${apiData.evidencias ? apiData.evidencias.length : 0} arquivos`);
      } else {
        console.log('❌ Erro na API:', apiData);
      }
    } catch (error) {
      console.error('❌ Erro ao chamar API:', error.message);
    }

    // 4. Testar com ID inválido
    console.log('\n4. 🧪 Testando com ID inválido...');
    
    try {
      const invalidResponse = await fetch(`http://localhost:3001/api/regional-activities/invalid-id/with-files`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const invalidData = await invalidResponse.json();
      
      console.log(`Status com ID inválido: ${invalidResponse.status}`);
      console.log(`Resposta: ${JSON.stringify(invalidData)}`);
    } catch (error) {
      console.error('❌ Erro ao testar ID inválido:', error.message);
    }

    // 5. Testar sem token
    console.log('\n5. 🧪 Testando sem token...');
    
    try {
      const noTokenResponse = await fetch(`http://localhost:3001/api/regional-activities/${testActivity.id}/with-files`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const noTokenData = await noTokenResponse.json();
      
      console.log(`Status sem token: ${noTokenResponse.status}`);
      console.log(`Resposta: ${JSON.stringify(noTokenData)}`);
    } catch (error) {
      console.error('❌ Erro ao testar sem token:', error.message);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testAuthWithValidCredentials();