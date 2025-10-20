const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testApiRequest() {
  try {
    console.log('🧪 Testando requisição HTTP real...\n');
    
    // 1. Fazer login para obter token
    console.log('🔐 Fazendo login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'flavioalmeidaf3@gmail.com',
      password: 'Flavio@123'
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError);
      return;
    }
    
    const token = loginData.session?.access_token;
    if (!token) {
      console.error('❌ Token não encontrado');
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    
    // 2. Testar endpoint /me
    console.log('\n🔍 Testando endpoint /me...');
    const meResponse = await fetch('http://localhost:4000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const meData = await meResponse.json();
    console.log(`   Status: ${meResponse.status}`);
    console.log(`   Dados:`, JSON.stringify(meData, null, 2));
    
    // 3. Testar endpoint GET regional-activities
    console.log('\n🔍 Testando GET /api/regional-activities...');
    const getResponse = await fetch('http://localhost:4000/api/regional-activities', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${getResponse.status}`);
    if (getResponse.status !== 200) {
      const errorData = await getResponse.json();
      console.log(`   Erro:`, JSON.stringify(errorData, null, 2));
    } else {
      console.log('   ✅ GET funcionou corretamente');
    }
    
    // 4. Testar endpoint POST regional-activities
    console.log('\n🔍 Testando POST /api/regional-activities...');
    const postData = {
      title: 'Teste de Atividade',
      description: 'Descrição de teste',
      type: 'workshop',
      activity_date: '2024-01-15',
      regional: 'R. Centro-Oeste',
      status: 'planejada'
    };
    
    const postResponse = await fetch('http://localhost:4000/api/regional-activities', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });
    
    console.log(`   Status: ${postResponse.status}`);
    const responseData = await postResponse.json();
    console.log(`   Resposta:`, JSON.stringify(responseData, null, 2));
    
    if (postResponse.status === 403) {
      console.log('\n💡 ERRO 403 CONFIRMADO!');
      console.log('   O middleware está bloqueando a requisição');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testApiRequest();