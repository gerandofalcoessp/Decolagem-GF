const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumnsDirectly() {
  console.log('🔧 Adicionando colunas faltantes diretamente...\n');

  try {
    // 1. Verificar estrutura atual das tabelas
    console.log('1. Verificando estrutura atual das tabelas...');
    
    // Verificar goals
    const { data: goalsInfo, error: goalsInfoError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'goals')
      .eq('table_schema', 'public');

    if (goalsInfoError) {
      console.error('❌ Erro ao verificar tabela goals:', goalsInfoError);
    } else {
      console.log('📊 Colunas atuais da tabela goals:');
      goalsInfo.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }

    // Verificar activities
    const { data: activitiesInfo, error: activitiesInfoError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'activities')
      .eq('table_schema', 'public');

    if (activitiesInfoError) {
      console.error('❌ Erro ao verificar tabela activities:', activitiesInfoError);
    } else {
      console.log('\n📊 Colunas atuais da tabela activities:');
      activitiesInfo.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }

    // 2. Tentar inserir dados de teste para verificar quais colunas estão faltando
    console.log('\n2. Testando inserção para identificar colunas faltantes...');

    // Testar goals com description
    console.log('\nTestando goals com description...');
    const { data: goalTest, error: goalTestError } = await supabase
      .from('goals')
      .insert({
        nome: 'Teste Description',
        description: 'Teste de descrição',
        member_id: 1
      })
      .select()
      .single();

    if (goalTestError) {
      console.log(`❌ Erro ao inserir goal com description: ${goalTestError.message}`);
      if (goalTestError.message.includes('column "description" of relation "goals" does not exist')) {
        console.log('🔧 Coluna description não existe na tabela goals');
      }
    } else {
      console.log('✅ Goal com description inserido com sucesso');
      // Limpar teste
      await supabase.from('goals').delete().eq('id', goalTest.id);
    }

    // Testar activities com titulo
    console.log('\nTestando activities com titulo...');
    const { data: activityTest, error: activityTestError } = await supabase
      .from('activities')
      .insert({
        titulo: 'Teste Titulo',
        member_id: 1
      })
      .select()
      .single();

    if (activityTestError) {
      console.log(`❌ Erro ao inserir activity com titulo: ${activityTestError.message}`);
      if (activityTestError.message.includes('column "titulo" of relation "activities" does not exist')) {
        console.log('🔧 Coluna titulo não existe na tabela activities');
      }
    } else {
      console.log('✅ Activity com titulo inserido com sucesso');
      // Limpar teste
      await supabase.from('activities').delete().eq('id', activityTest.id);
    }

    // 3. Verificar se as colunas necessárias existem
    const goalsHasDescription = goalsInfo?.some(col => col.column_name === 'description');
    const activitiesHasTitulo = activitiesInfo?.some(col => col.column_name === 'titulo');

    console.log('\n3. Status das colunas necessárias:');
    console.log(`   goals.description: ${goalsHasDescription ? '✅ Existe' : '❌ Não existe'}`);
    console.log(`   activities.titulo: ${activitiesHasTitulo ? '✅ Existe' : '❌ Não existe'}`);

    // 4. Tentar criar as colunas usando SQL direto (se possível)
    console.log('\n4. Tentando criar colunas via SQL direto...');
    
    if (!goalsHasDescription) {
      console.log('Tentando criar coluna description na tabela goals...');
      // Como não temos exec_sql, vamos tentar uma abordagem diferente
      console.log('⚠️  Não é possível criar colunas via API do Supabase');
      console.log('   Você precisa executar este SQL manualmente no painel do Supabase:');
      console.log('   ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS description text;');
    }

    if (!activitiesHasTitulo) {
      console.log('Tentando criar coluna titulo na tabela activities...');
      console.log('⚠️  Não é possível criar colunas via API do Supabase');
      console.log('   Você precisa executar este SQL manualmente no painel do Supabase:');
      console.log('   ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS titulo varchar(255);');
    }

    console.log('\n📋 RESUMO:');
    console.log('Para resolver os problemas de API, execute os seguintes comandos SQL no painel do Supabase:');
    console.log('');
    console.log('-- Adicionar coluna description à tabela goals');
    console.log('ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS description text;');
    console.log('');
    console.log('-- Adicionar coluna titulo à tabela activities');
    console.log('ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS titulo varchar(255);');
    console.log('');
    console.log('Após executar esses comandos, as APIs de POST para goals e activities devem funcionar corretamente.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

addColumnsDirectly().catch(console.error);