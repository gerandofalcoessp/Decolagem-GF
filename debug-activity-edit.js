const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugActivityEdit() {
  console.log('🔍 Debugando problema de edição de atividades...\n');

  try {
    // 1. Listar todas as atividades para ver IDs disponíveis
    console.log('1️⃣ Listando atividades existentes...');
    const { data: activities, error: listError } = await supabaseAdmin
      .from('regional_activities')
      .select('id, title, type, regional, activity_date, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (listError) {
      console.error('❌ Erro ao listar atividades:', listError.message);
      return;
    }

    if (!activities || activities.length === 0) {
      console.log('❌ Nenhuma atividade encontrada na base de dados');
      return;
    }

    console.log(`✅ Encontradas ${activities.length} atividades:`);
    activities.forEach((activity, index) => {
      console.log(`   ${index + 1}. ID: ${activity.id}`);
      console.log(`      Título: ${activity.title}`);
      console.log(`      Tipo: ${activity.type}`);
      console.log(`      Regional: ${activity.regional}`);
      console.log(`      Data: ${activity.activity_date}`);
      console.log('');
    });

    // 2. Testar busca por ID específico (usar o primeiro da lista)
    if (activities.length > 0) {
      const testId = activities[0].id;
      console.log(`2️⃣ Testando busca por ID específico: ${testId}`);
      
      const { data: singleActivity, error: singleError } = await supabaseAdmin
        .from('regional_activities')
        .select('*')
        .eq('id', testId)
        .single();

      if (singleError) {
        console.error('❌ Erro ao buscar atividade por ID:', singleError.message);
        console.error('   Detalhes:', singleError);
      } else if (!singleActivity) {
        console.log('❌ Atividade não encontrada por ID');
      } else {
        console.log('✅ Atividade encontrada por ID:');
        console.log('   ID:', singleActivity.id);
        console.log('   Título:', singleActivity.title);
        console.log('   Tipo:', singleActivity.type);
        console.log('   Regional:', singleActivity.regional);
        console.log('   Responsável ID:', singleActivity.responsavel_id);
        console.log('   Instituição ID:', singleActivity.instituicao_id);
        console.log('   Estados:', singleActivity.estados);
        console.log('   Evidências:', singleActivity.evidences);
      }
    }

    // 3. Verificar se há problemas com UUIDs
    console.log('\n3️⃣ Verificando formato dos IDs...');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    activities.forEach((activity, index) => {
      const isValidUUID = uuidRegex.test(activity.id);
      console.log(`   ${index + 1}. ${activity.id} - ${isValidUUID ? '✅ UUID válido' : '❌ UUID inválido'}`);
    });

    // 4. Testar endpoint da API diretamente
    console.log('\n4️⃣ Testando endpoint da API...');
    const testId = activities[0].id;
    
    try {
      const response = await fetch(`http://localhost:3001/api/regional-activities/${testId}/with-files`, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status da resposta: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API respondeu com sucesso:');
        console.log('   ID:', data.id);
        console.log('   Título:', data.titulo);
        console.log('   Tipo:', data.tipo);
      } else {
        const errorData = await response.text();
        console.log('❌ API retornou erro:');
        console.log('   Resposta:', errorData);
      }
    } catch (apiError) {
      console.log('❌ Erro ao chamar API:', apiError.message);
      console.log('   Verifique se o backend está rodando na porta 3001');
    }

    // 5. Verificar políticas RLS
    console.log('\n5️⃣ Verificando políticas RLS para regional_activities...');
    const { data: policies, error: policiesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'regional_activities'
        ORDER BY policyname;
      `
    });

    if (policiesError) {
      console.error('❌ Erro ao verificar políticas RLS:', policiesError.message);
    } else if (policies && policies.length > 0) {
      console.log(`✅ Encontradas ${policies.length} políticas RLS:`);
      policies.forEach((policy, index) => {
        console.log(`   ${index + 1}. ${policy.policyname}`);
        console.log(`      Comando: ${policy.cmd}`);
        console.log(`      Roles: ${policy.roles}`);
        console.log(`      Condição: ${policy.qual || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhuma política RLS encontrada para regional_activities');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar debug
debugActivityEdit().catch(console.error);