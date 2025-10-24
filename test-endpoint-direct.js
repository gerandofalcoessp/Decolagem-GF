const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEndpointDirect() {
  console.log('🧪 Testando endpoint /api/instituicoes/stats diretamente...\n');

  try {
    // 1. Fazer login para obter token
    console.log('1. 🔐 Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'flavio.almeida@gerandofalcoes.com',
      password: '123456'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }

    const token = authData.session.access_token;
    console.log(`✅ Token obtido: ${token.substring(0, 20)}...`);

    // 2. Testar endpoint com fetch
    console.log('\n2. 🌐 Testando endpoint com fetch...');
    
    const response = await fetch('http://localhost:4000/api/instituicoes/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Erro HTTP: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Resposta:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Resposta do endpoint:');
    console.log(JSON.stringify(data, null, 2));

    // 3. Verificar dados específicos
    if (data.data && data.data.resumo) {
      console.log('\n3. 📊 Dados específicos:');
      console.log(`   ONGs Maras: ${data.data.resumo.ongsMaras}`);
      console.log(`   ONGs Decolagem: ${data.data.resumo.ongsDecolagem}`);
      console.log(`   Total: ${data.data.total}`);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testEndpointDirect();