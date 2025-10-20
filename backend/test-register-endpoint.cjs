const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function testRegisterEndpoint() {
  console.log('🧪 Testando endpoint de registro...\n');

  // 1. Fazer login como super admin
  console.log('🔑 Fazendo login como super admin...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'flavio.almeida@gerandofalcoes.com',
    password: 'password123'
  });

  if (authError) {
    console.error('❌ Erro no login:', authError.message);
    return;
  }

  console.log('✅ Login realizado com sucesso');
  const token = authData.session.access_token;

  // 2. Testar endpoint de registro
  console.log('\n📝 Testando criação de usuário...');
  
  const testUserData = {
    nome: 'Erika Miranda',
    email: `coord.regional.sp.${Date.now()}@gerandofalcoes.com`,
    password: 'TestPassword123!',
    role: 'super_admin',
    funcao: 'Coordenador',
    regional: 'R. São Paulo'
  };

  console.log('Dados do usuário:', testUserData);

  try {
    const response = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testUserData)
    });

    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));

    const result = await response.text();
    console.log('Resposta bruta:', result);

    if (response.ok) {
      console.log('✅ Usuário criado com sucesso!');
      try {
        const jsonResult = JSON.parse(result);
        console.log('Dados do usuário criado:', jsonResult);
      } catch (e) {
        console.log('Resposta não é JSON válido');
      }
    } else {
      console.error('❌ Erro ao criar usuário');
      console.error('Status:', response.status);
      console.error('Resposta:', result);
      
      try {
        const errorJson = JSON.parse(result);
        console.error('Erro detalhado:', errorJson);
      } catch (e) {
        console.error('Erro não é JSON válido');
      }
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }

  console.log('\n🏁 Teste concluído');
}

testRegisterEndpoint().catch(console.error);