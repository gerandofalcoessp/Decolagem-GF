const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixDeiseWithCorrectColumns() {
  console.log('🔧 Corrigindo dados da Deise com colunas corretas...\n');
  
  try {
    // 1. Buscar dados atuais da Deise
    console.log('1️⃣ Buscando dados atuais da Deise...');
    
    const { data: deiseData, error: deiseError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('name', 'Deise')
      .single();
    
    if (deiseError || !deiseData) {
      console.log('❌ Erro ao buscar Deise:', deiseError?.message);
      return;
    }
    
    console.log('✅ Dados atuais da Deise:');
    console.log(`   ID: ${deiseData.id}`);
    console.log(`   Auth User ID: ${deiseData.auth_user_id}`);
    console.log(`   Nome: ${deiseData.name}`);
    console.log(`   Email: ${deiseData.email}`);
    console.log(`   Função: ${deiseData.funcao}`);
    console.log(`   Área: ${deiseData.area}`);
    console.log(`   Regional: ${deiseData.regional}`);
    console.log('');
    
    // 2. Atualizar dados necessários
    let updateData = {};
    let needsUpdate = false;
    
    // Definir regional como centro_oeste se não estiver definido
    if (!deiseData.regional) {
      console.log('2️⃣ Definindo regional...');
      updateData.regional = 'centro_oeste';
      needsUpdate = true;
      console.log(`   Definindo regional como: centro_oeste`);
    }
    
    // Definir área se não estiver definida
    if (!deiseData.area) {
      console.log('3️⃣ Definindo área...');
      updateData.area = 'Coordenação Regional';
      needsUpdate = true;
      console.log(`   Definindo área como: Coordenação Regional`);
    }
    
    // 4. Atualizar dados se necessário
    if (needsUpdate) {
      console.log('4️⃣ Atualizando dados da Deise...');
      
      const { data: updatedData, error: updateError } = await supabaseAdmin
        .from('members')
        .update(updateData)
        .eq('id', deiseData.id)
        .select('*')
        .single();
      
      if (updateError) {
        console.log('❌ Erro ao atualizar:', updateError.message);
      } else {
        console.log('✅ Dados atualizados com sucesso:');
        console.log(`   Regional: ${updatedData.regional}`);
        console.log(`   Área: ${updatedData.area}`);
      }
    } else {
      console.log('ℹ️ Nenhuma atualização necessária');
    }
    
    // 5. Verificar a política RLS atual
    console.log('\n5️⃣ Verificando política RLS atual...');
    
    const { data: activity, error: activityError } = await supabaseAdmin
      .from('regional_activities')
      .select('*')
      .eq('regional', 'centro_oeste')
      .single();
    
    if (activity && !activityError) {
      console.log(`   Atividade encontrada: "${activity.title}"`);
      console.log(`   Member ID: ${activity.member_id}`);
      
      // Verificar se o member_id corresponde à Deise
      const isOwner = activity.member_id === deiseData.id;
      console.log(`   Deise é a criadora: ${isOwner ? '✅' : '❌'}`);
      
      if (isOwner) {
        console.log(`   ✅ Deise deveria poder deletar por ownership!`);
        
        // Vamos testar a exclusão novamente
        console.log('\n6️⃣ Testando exclusão com admin...');
        
        try {
          // Primeiro, vamos verificar se conseguimos deletar com admin
          const { data: deleteResult, error: deleteError } = await supabaseAdmin
            .from('regional_activities')
            .delete()
            .eq('id', activity.id)
            .select('*');
          
          if (deleteError) {
            console.log(`❌ Erro ao deletar com admin: ${deleteError.message}`);
            console.log(`   Código: ${deleteError.code}`);
            console.log(`   Detalhes: ${deleteError.details}`);
            console.log(`   Hint: ${deleteError.hint}`);
          } else {
            console.log(`✅ Atividade deletada com sucesso pelo admin!`);
            
            // Recriar a atividade
            console.log('🔄 Recriando atividade...');
            
            const { error: recreateError } = await supabaseAdmin
              .from('regional_activities')
              .insert({
                id: activity.id,
                title: activity.title,
                description: activity.description,
                activity_date: activity.activity_date,
                type: activity.type,
                member_id: activity.member_id,
                regional: activity.regional,
                status: activity.status,
                programa: activity.programa,
                estados: activity.estados,
                instituicao_id: activity.instituicao_id,
                quantidade: activity.quantidade,
                responsavel_id: activity.responsavel_id,
                evidences: activity.evidences,
                atividade_label: activity.atividade_label,
                atividade_custom_label: activity.atividade_custom_label,
                created_at: activity.created_at,
                updated_at: activity.updated_at
              });
            
            if (recreateError) {
              console.log(`⚠️ Erro ao recriar atividade: ${recreateError.message}`);
            } else {
              console.log(`✅ Atividade recriada com sucesso`);
            }
          }
        } catch (error) {
          console.log(`❌ Erro inesperado: ${error.message}`);
        }
      }
    }
    
    // 7. Investigar por que a exclusão não funciona no frontend
    console.log('\n7️⃣ Investigando problema do frontend...');
    
    console.log('   Possíveis causas:');
    console.log('   1. RLS não está habilitado corretamente');
    console.log('   2. Política RLS não está funcionando como esperado');
    console.log('   3. Frontend não está enviando token de autenticação');
    console.log('   4. Token de autenticação não está válido');
    console.log('   5. Contexto de usuário não está sendo passado corretamente');
    
    console.log('\n   Próximos passos recomendados:');
    console.log('   1. Verificar se RLS está habilitado na tabela regional_activities');
    console.log('   2. Testar exclusão com usuário autenticado (não admin)');
    console.log('   3. Verificar logs do frontend durante tentativa de exclusão');
    console.log('   4. Verificar se o token JWT contém as informações corretas');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixDeiseWithCorrectColumns().catch(console.error);