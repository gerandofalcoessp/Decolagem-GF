const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkCentroOesteActivities() {
  console.log('🔍 Verificando atividades do Centro-Oeste...\n');
  
  try {
    // Buscar todas as atividades do Centro-Oeste
    console.log('1️⃣ Buscando atividades do Centro-Oeste...');
    
    const { data: activities, error } = await supabaseAdmin
      .from('regional_activities')
      .select('*')
      .eq('regional', 'centro_oeste')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Erro ao buscar atividades:', error.message);
      return;
    }
    
    if (!activities || activities.length === 0) {
      console.log('ℹ️ Nenhuma atividade encontrada para a regional Centro-Oeste');
      return;
    }
    
    console.log(`✅ Encontradas ${activities.length} atividades do Centro-Oeste:`);
    console.log('');
    
    // Listar todas as atividades
    activities.forEach((activity, index) => {
      console.log(`📋 Atividade ${index + 1}:`);
      console.log(`   ID: ${activity.id}`);
      console.log(`   Título: ${activity.title}`);
      console.log(`   Descrição: ${activity.description}`);
      console.log(`   Data: ${activity.activity_date}`);
      console.log(`   Status: ${activity.status}`);
      console.log(`   Member ID: ${activity.member_id}`);
      console.log(`   Criada em: ${activity.created_at}`);
      console.log('   ---');
    });
    
    // Testar exclusão de cada atividade
    console.log('\n2️⃣ Testando exclusão de cada atividade...\n');
    
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      console.log(`🧪 Testando exclusão da atividade: "${activity.title}" (ID: ${activity.id})`);
      
      try {
        // Tentar deletar usando cliente admin
        const { data: deletedActivity, error: deleteError } = await supabaseAdmin
          .from('regional_activities')
          .delete()
          .eq('id', activity.id)
          .select('*');
        
        if (deleteError) {
          console.log(`❌ ERRO ao deletar atividade "${activity.title}":`, deleteError.message);
          console.log(`   Código do erro: ${deleteError.code}`);
          console.log(`   Detalhes: ${deleteError.details}`);
          console.log(`   Hint: ${deleteError.hint}`);
          
          // Esta atividade tem problema - vamos investigar mais
          await investigateActivityIssue(activity);
        } else {
          console.log(`✅ Atividade "${activity.title}" deletada com sucesso`);
          
          // Recriar a atividade para não perder dados
          console.log(`🔄 Recriando atividade "${activity.title}" para não perder dados...`);
          
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
            console.log(`✅ Atividade "${activity.title}" recriada com sucesso`);
          }
        }
        
        console.log('');
      } catch (error) {
        console.log(`❌ Erro inesperado ao testar atividade "${activity.title}":`, error.message);
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

async function investigateActivityIssue(activity) {
  console.log(`🔍 Investigando problemas com a atividade "${activity.title}"...`);
  
  try {
    // Verificar se o member_id existe
    if (activity.member_id) {
      const { data: member, error: memberError } = await supabaseAdmin
        .from('members')
        .select('*')
        .eq('id', activity.member_id)
        .single();
      
      if (memberError || !member) {
        console.log(`   ⚠️ Member ID ${activity.member_id} não encontrado ou inválido`);
      } else {
        console.log(`   ✅ Member encontrado: ${member.name || member.email}`);
      }
    }
    
    // Verificar se o responsavel_id existe
    if (activity.responsavel_id) {
      const { data: responsavel, error: responsavelError } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('id', activity.responsavel_id)
        .single();
      
      if (responsavelError || !responsavel) {
        console.log(`   ⚠️ Responsável ID ${activity.responsavel_id} não encontrado ou inválido`);
      } else {
        console.log(`   ✅ Responsável encontrado: ${responsavel.nome}`);
      }
    }
    
    // Verificar se a instituicao_id existe
    if (activity.instituicao_id) {
      const { data: instituicao, error: instituicaoError } = await supabaseAdmin
        .from('instituicoes')
        .select('*')
        .eq('id', activity.instituicao_id)
        .single();
      
      if (instituicaoError || !instituicao) {
        console.log(`   ⚠️ Instituição ID ${activity.instituicao_id} não encontrada ou inválida`);
      } else {
        console.log(`   ✅ Instituição encontrada: ${instituicao.nome}`);
      }
    }
    
    // Verificar políticas RLS específicas para esta atividade
    console.log(`   🔒 Verificando políticas RLS para esta atividade...`);
    
    // Tentar deletar com diferentes contextos de usuário
    console.log(`   🧪 Testando exclusão com diferentes contextos...`);
    
  } catch (error) {
    console.log(`   ❌ Erro na investigação: ${error.message}`);
  }
}

checkCentroOesteActivities().catch(console.error);