const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugActivitiesTable() {
  try {
    console.log('🔍 Verificando tabela "activities"...\n');

    // 1. Verificar se a tabela existe e tem dados
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .limit(10);

    if (activitiesError) {
      console.error('❌ Erro ao consultar tabela "activities":', activitiesError.message);
      console.log('   - Código do erro:', activitiesError.code);
      console.log('   - Detalhes:', activitiesError.details);
      console.log('   - Hint:', activitiesError.hint);
    } else {
      console.log('✅ Tabela "activities" encontrada');
      console.log(`   - Total de registros (primeiros 10): ${activitiesData.length}`);
      
      if (activitiesData.length > 0) {
        console.log('   - Estrutura do primeiro registro:');
        console.log('     ', Object.keys(activitiesData[0]));
        console.log('   - Primeiro registro:', activitiesData[0]);
      } else {
        console.log('   - Tabela está vazia');
      }
    }

    // 2. Verificar se existe tabela "regional_activities" para comparação
    console.log('\n🔍 Comparando com tabela "regional_activities"...\n');
    
    const { data: regionalData, error: regionalError } = await supabase
      .from('regional_activities')
      .select('*')
      .limit(5);

    if (regionalError) {
      console.error('❌ Erro ao consultar tabela "regional_activities":', regionalError.message);
    } else {
      console.log('✅ Tabela "regional_activities" encontrada');
      console.log(`   - Total de registros (primeiros 5): ${regionalData.length}`);
      
      if (regionalData.length > 0) {
        console.log('   - Estrutura do primeiro registro:');
        console.log('     ', Object.keys(regionalData[0]));
      }
    }

    // 3. Verificar se existe tabela "usuarios" para o join
    console.log('\n🔍 Verificando tabela "usuarios" para o join...\n');
    
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, nome, email, regional, funcao, area')
      .limit(3);

    if (usuariosError) {
      console.error('❌ Erro ao consultar tabela "usuarios":', usuariosError.message);
      console.log('   - Código do erro:', usuariosError.code);
      console.log('   - Detalhes:', usuariosError.details);
    } else {
      console.log('✅ Tabela "usuarios" encontrada');
      console.log(`   - Total de registros (primeiros 3): ${usuariosData.length}`);
    }

    // 4. Testar o join específico usado no endpoint
    if (!activitiesError && !usuariosError) {
      console.log('\n🔍 Testando join específico do endpoint...\n');
      
      const { data: joinData, error: joinError } = await supabase
        .from('activities')
        .select(`
          *,
          responsavel:usuarios!activities_responsavel_id_fkey(
            id,
            nome,
            email,
            regional,
            funcao,
            area
          )
        `)
        .limit(3);

      if (joinError) {
        console.error('❌ Erro no join:', joinError.message);
        console.log('   - Código do erro:', joinError.code);
        console.log('   - Detalhes:', joinError.details);
        console.log('   - Hint:', joinError.hint);
      } else {
        console.log('✅ Join funcionando');
        console.log(`   - Registros retornados: ${joinData.length}`);
        if (joinData.length > 0) {
          console.log('   - Primeiro registro com join:', JSON.stringify(joinData[0], null, 2));
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

debugActivitiesTable().catch(console.error);