const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAPIEndpoint() {
  console.log('🔍 Testando endpoint da API para edição de atividades...\n');

  try {
    // 1. Buscar uma atividade existente
    console.log('1️⃣ Buscando atividade existente...');
    const { data: activities, error: listError } = await supabaseAdmin
      .from('regional_activities')
      .select('id, title, type, regional')
      .limit(1);

    if (listError || !activities || activities.length === 0) {
      console.log('❌ Nenhuma atividade encontrada para testar');
      return;
    }

    const testActivity = activities[0];
    console.log(`✅ Usando atividade: ${testActivity.id} - ${testActivity.title}`);

    // 2. Testar endpoint GET /api/regional-activities/:id/with-files
    console.log('\n2️⃣ Testando endpoint GET...');
    
    try {
      const response = await fetch(`http://localhost:3001/api/regional-activities/${testActivity.id}/with-files`);
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Resposta da API:');
        console.log(`   ID: ${data.id}`);
        console.log(`   Título: ${data.titulo || data.title}`);
        console.log(`   Tipo: ${data.tipo || data.type}`);
        console.log(`   Regional: ${data.regional}`);
        console.log(`   Responsável ID: ${data.responsavel_id}`);
        console.log(`   Instituição ID: ${data.instituicao_id}`);
        console.log(`   Estados: ${JSON.stringify(data.estados)}`);
        console.log(`   Evidências: ${JSON.stringify(data.evidences || data.evidencias)}`);
      } else {
        const errorText = await response.text();
        console.log('❌ Erro na API:');
        console.log(`   Resposta: ${errorText}`);
      }
    } catch (fetchError) {
      console.log('❌ Erro ao fazer fetch:', fetchError.message);
    }

    // 3. Testar com ID inválido
    console.log('\n3️⃣ Testando com ID inválido...');
    
    try {
      const invalidResponse = await fetch(`http://localhost:3001/api/regional-activities/invalid-id/with-files`);
      console.log(`   Status: ${invalidResponse.status} ${invalidResponse.statusText}`);
      
      const invalidText = await invalidResponse.text();
      console.log(`   Resposta: ${invalidText}`);
    } catch (invalidError) {
      console.log('❌ Erro ao testar ID inválido:', invalidError.message);
    }

    // 4. Testar com ID UUID válido mas inexistente
    console.log('\n4️⃣ Testando com UUID válido mas inexistente...');
    
    try {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const nonExistentResponse = await fetch(`http://localhost:3001/api/regional-activities/${nonExistentId}/with-files`);
      console.log(`   Status: ${nonExistentResponse.status} ${nonExistentResponse.statusText}`);
      
      const nonExistentText = await nonExistentResponse.text();
      console.log(`   Resposta: ${nonExistentText}`);
    } catch (nonExistentError) {
      console.log('❌ Erro ao testar UUID inexistente:', nonExistentError.message);
    }

    // 5. Verificar se há diferença entre busca direta no Supabase vs API
    console.log('\n5️⃣ Comparando busca direta no Supabase vs API...');
    
    const { data: directData, error: directError } = await supabaseAdmin
      .from('regional_activities')
      .select('*')
      .eq('id', testActivity.id)
      .single();

    if (directError) {
      console.log('❌ Erro na busca direta:', directError.message);
    } else {
      console.log('✅ Busca direta no Supabase funcionou');
      console.log(`   Dados encontrados: ${JSON.stringify(directData, null, 2)}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar teste
testAPIEndpoint().catch(console.error);