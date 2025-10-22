const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function testApiWithExistingActivity() {
  console.log('🧪 Testando API com atividade existente...\n');

  try {
    // 1. Login com credenciais válidas
    console.log('1. 🔐 Fazendo login...');
    
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'flavio.almeida@gerandofalcoes.com',
        password: '123456'
      }),
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Erro no login:', loginData);
      return;
    }

    const token = loginData.session?.access_token || loginData.access_token || loginData.token;
    console.log('✅ Login bem-sucedido!');

    // 2. Buscar atividades existentes diretamente no Supabase
    console.log('\n2. 🔍 Buscando atividades no Supabase...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: activities, error: activitiesError } = await supabase
      .from('regional_activities')
      .select('*')
      .limit(5);

    if (activitiesError) {
      console.error('❌ Erro ao buscar atividades:', activitiesError.message);
      return;
    }

    console.log(`✅ Encontradas ${activities.length} atividades:`);
    activities.forEach((activity, index) => {
      console.log(`   ${index + 1}. ${activity.title} (ID: ${activity.id})`);
      console.log(`      Tipo: ${activity.type || 'N/A'}`);
      console.log(`      Regional: ${activity.regional || 'N/A'}`);
      console.log(`      Data: ${activity.activity_date || 'N/A'}`);
      console.log('');
    });

    if (activities.length === 0) {
      console.log('❌ Nenhuma atividade encontrada no banco');
      
      // Criar uma atividade de teste
      console.log('\n3. 📝 Criando atividade de teste...');
      
      // Primeiro, buscar um member_id válido
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id')
        .limit(1);

      if (membersError || !members || members.length === 0) {
        console.error('❌ Erro ao buscar members ou nenhum member encontrado');
        return;
      }

      const testActivity = {
        member_id: members[0].id,
        title: 'Atividade de Teste API',
        description: 'Atividade criada para testar a API',
        activity_date: new Date().toISOString().split('T')[0],
        type: 'teste',
        regional: 'SP',
        status: 'ativo'
      };

      const { data: newActivity, error: createError } = await supabase
        .from('regional_activities')
        .insert(testActivity)
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar atividade:', createError.message);
        return;
      }

      console.log('✅ Atividade de teste criada:', newActivity.title);
      activities.push(newActivity);
    }

    // 3. Testar endpoint da API com atividade existente
    const testActivity = activities[0];
    console.log(`\n4. 🧪 Testando endpoint da API com atividade: ${testActivity.title}`);
    
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
        console.log(`   Tipo: ${apiData.type || 'N/A'}`);
        console.log(`   Regional: ${apiData.regional || 'N/A'}`);
        console.log(`   Descrição: ${apiData.description || 'N/A'}`);
        console.log(`   Data: ${apiData.activity_date || 'N/A'}`);
        console.log(`   Evidências: ${apiData.evidencias ? apiData.evidencias.length : 0} arquivos`);
      } else {
        console.log('❌ Erro na API:', apiData);
        
        // Verificar se é erro de autenticação
        if (apiResponse.status === 401) {
          console.log('🔍 Erro de autenticação detectado. Verificando token...');
          console.log(`   Token válido: ${token ? 'Sim' : 'Não'}`);
          console.log(`   Token length: ${token ? token.length : 0}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao chamar API:', error.message);
    }

    // 4. Testar endpoint sem token para comparar
    console.log('\n5. 🧪 Testando sem token para comparar...');
    
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

testApiWithExistingActivity();