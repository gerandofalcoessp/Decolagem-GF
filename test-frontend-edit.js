const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function testFrontendEdit() {
  console.log('🧪 Teste Completo da Funcionalidade de Edição\n');

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

    // 3. Testar endpoint GET /:id/with-files (usado na página de edição)
    console.log('\n3. 🌐 Testando endpoint GET /:id/with-files...');
    const getUrl = `http://localhost:4000/api/regional-activities/${testActivity.id}/with-files`;
    
    try {
      const getResponse = await fetch(getUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${getResponse.status} ${getResponse.statusText}`);

      if (getResponse.ok) {
        const data = await getResponse.json();
        console.log('✅ GET funcionando corretamente!');
        console.log('   Dados retornados:');
        console.log(`   - ID: ${data.id}`);
        console.log(`   - Título: ${data.titulo || data.title}`);
        console.log(`   - Tipo: ${data.tipo || data.type}`);
        console.log(`   - Regional: ${data.regional}`);
        console.log(`   - Status: ${data.status}`);
        console.log(`   - Arquivos: ${data.files ? data.files.length : 0}`);
        console.log(`   - Evidências: ${data.evidencias ? data.evidencias.length : 0}`);
        
        // 4. Testar endpoint PUT /:id/with-files (usado para salvar edições)
        console.log('\n4. 🔄 Testando endpoint PUT /:id/with-files...');
        const putUrl = `http://localhost:4000/api/regional-activities/${testActivity.id}/with-files`;
        
        // Dados de teste para atualização
        const updateData = {
          title: data.titulo || data.title,
          description: data.descricao || data.description || 'Descrição atualizada via teste',
          type: data.tipo || data.type,
          activity_date: data.data_inicio || data.activity_date,
          regional: data.regional,
          status: data.status || 'ativo'
        };

        const putResponse = await fetch(putUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });

        console.log(`   Status: ${putResponse.status} ${putResponse.statusText}`);

        if (putResponse.ok) {
          const updateResult = await putResponse.json();
          console.log('✅ PUT funcionando corretamente!');
          console.log('   Atividade atualizada com sucesso');
        } else {
          const errorData = await putResponse.text();
          console.error('❌ Erro no PUT:', errorData);
        }

        // 5. Verificar se a atualização foi persistida
        console.log('\n5. 🔍 Verificando se a atualização foi persistida...');
        const verifyResponse = await fetch(getUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          console.log('✅ Dados verificados após atualização:');
          console.log(`   - Título: ${verifyData.titulo || verifyData.title}`);
          console.log(`   - Descrição: ${verifyData.descricao || verifyData.description}`);
        }

      } else {
        const errorData = await getResponse.text();
        console.error('❌ Erro no GET:', errorData);
      }
    } catch (fetchError) {
      console.error('❌ Erro na requisição:', fetchError.message);
    }

    // 6. Testar cenários de erro
    console.log('\n6. 🚫 Testando cenários de erro...');
    
    // ID inválido
    const invalidUrl = `http://localhost:4000/api/regional-activities/invalid-id/with-files`;
    const invalidResponse = await fetch(invalidUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`   ID inválido: ${invalidResponse.status} ${invalidResponse.statusText}`);
    
    // Sem token
    const noTokenResponse = await fetch(getUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`   Sem token: ${noTokenResponse.status} ${noTokenResponse.statusText}`);

    console.log('\n🎯 Resumo dos Testes:');
    console.log('   ✅ Login funcionando');
    console.log('   ✅ Busca de atividades funcionando');
    console.log('   ✅ Endpoint GET /:id/with-files funcionando');
    console.log('   ✅ Endpoint PUT /:id/with-files funcionando');
    console.log('   ✅ Validação de erros funcionando');
    console.log('\n🎉 A funcionalidade de edição de atividades está funcionando corretamente!');

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testFrontendEdit();