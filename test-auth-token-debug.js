const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAuthToken() {
  console.log('🔍 Testando autenticação e token...\n');

  try {
    // 1. Fazer login para obter um token válido
    console.log('1️⃣ Fazendo login para obter token...');
    
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'superadmin@decolagem.com',
        password: 'SuperAdmin123!'
      })
    });

    if (!loginResponse.ok) {
      const loginError = await loginResponse.text();
      console.log('❌ Erro no login:', loginError);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login bem-sucedido!');
    
    const token = loginData.session?.access_token;
    if (!token) {
      console.log('❌ Token não encontrado na resposta do login');
      return;
    }

    console.log(`   Token obtido: ${token.substring(0, 50)}...`);

    // 2. Buscar uma atividade existente
    console.log('\n2️⃣ Buscando atividade existente...');
    const { data: activities, error: listError } = await supabaseAdmin
      .from('regional_activities')
      .select('id, title, type')
      .limit(1);

    if (listError || !activities || activities.length === 0) {
      console.log('❌ Nenhuma atividade encontrada para testar');
      return;
    }

    const testActivity = activities[0];
    console.log(`✅ Usando atividade: ${testActivity.id} - ${testActivity.title}`);

    // 3. Testar endpoint com token válido
    console.log('\n3️⃣ Testando endpoint com token válido...');
    
    const validResponse = await fetch(`http://localhost:3001/api/regional-activities/${testActivity.id}/with-files`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${validResponse.status} ${validResponse.statusText}`);
    
    if (validResponse.ok) {
      const data = await validResponse.json();
      console.log('✅ Endpoint funcionou com token válido!');
      console.log(`   ID: ${data.id}`);
      console.log(`   Título: ${data.titulo || data.title}`);
      console.log(`   Tipo: ${data.tipo || data.type}`);
    } else {
      const errorText = await validResponse.text();
      console.log('❌ Erro mesmo com token válido:');
      console.log(`   Resposta: ${errorText}`);
    }

    // 4. Testar endpoint sem token
    console.log('\n4️⃣ Testando endpoint sem token...');
    
    const noTokenResponse = await fetch(`http://localhost:3001/api/regional-activities/${testActivity.id}/with-files`);
    console.log(`   Status: ${noTokenResponse.status} ${noTokenResponse.statusText}`);
    
    const noTokenText = await noTokenResponse.text();
    console.log(`   Resposta: ${noTokenText}`);

    // 5. Testar endpoint com token inválido
    console.log('\n5️⃣ Testando endpoint com token inválido...');
    
    const invalidTokenResponse = await fetch(`http://localhost:3001/api/regional-activities/${testActivity.id}/with-files`, {
      headers: {
        'Authorization': 'Bearer token-invalido',
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${invalidTokenResponse.status} ${invalidTokenResponse.statusText}`);
    
    const invalidTokenText = await invalidTokenResponse.text();
    console.log(`   Resposta: ${invalidTokenText}`);

    // 6. Verificar se o middleware de autenticação está funcionando
    console.log('\n6️⃣ Verificando middleware de autenticação...');
    
    const middlewareResponse = await fetch('http://localhost:3001/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status /auth/me: ${middlewareResponse.status} ${middlewareResponse.statusText}`);
    
    if (middlewareResponse.ok) {
      const userData = await middlewareResponse.json();
      console.log('✅ Middleware de autenticação funcionando!');
      console.log(`   Usuário: ${userData.member?.nome || userData.user?.nome}`);
      console.log(`   Role: ${userData.member?.role || userData.user?.role}`);
    } else {
      const middlewareError = await middlewareResponse.text();
      console.log('❌ Problema no middleware de autenticação:');
      console.log(`   Resposta: ${middlewareError}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar teste
testAuthToken().catch(console.error);