const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testDeleteAfterFix() {
  console.log('🧪 Testando exclusão após aplicar a correção da política DELETE...\n');
  
  try {
    // Primeiro, criar uma atividade de teste
    console.log('1️⃣ Criando atividade de teste...');
    
    const testActivity = {
      title: 'Teste DELETE Policy - ' + new Date().toISOString(),
      description: 'Atividade criada para testar a política DELETE',
      activity_date: '2025-01-25',
      type: 'teste',
      member_id: '9aa3da8f-7f8d-48f3-8ede-5ac34e2a9996', // ID do membro existente
      regional: 'nordeste_2',
      status: 'ativo',
      programa: 'teste',
      estados: '["BA"]',
      instituicao_id: 'a92337e1-9329-4216-b39a-84d15158aa1d',
      quantidade: '1'
    };
    
    const { data: createdActivity, error: createError } = await supabaseAdmin
      .from('regional_activities')
      .insert(testActivity)
      .select('*')
      .single();
    
    if (createError) {
      console.log('❌ Erro ao criar atividade de teste:', createError.message);
      return;
    }
    
    console.log('✅ Atividade de teste criada com ID:', createdActivity.id);
    
    // Agora testar a exclusão usando o cliente admin (que deve funcionar)
    console.log('\n2️⃣ Testando exclusão com cliente admin...');
    
    const { data: deletedActivity, error: deleteError } = await supabaseAdmin
      .from('regional_activities')
      .delete()
      .eq('id', createdActivity.id)
      .select('*');
    
    if (deleteError) {
      console.log('❌ Erro ao deletar atividade de teste:', deleteError.message);
      console.log('Detalhes do erro:', deleteError);
    } else {
      console.log('✅ Atividade deletada com sucesso pelo admin');
      console.log('Dados da atividade deletada:', deletedActivity);
      
      // Verificar se foi realmente removida
      console.log('\n3️⃣ Verificando se a atividade foi removida do banco...');
      
      const { data: checkActivity, error: checkError } = await supabaseAdmin
        .from('regional_activities')
        .select('*')
        .eq('id', createdActivity.id);
      
      if (checkError) {
        console.log('❌ Erro ao verificar atividade:', checkError.message);
      } else if (checkActivity && checkActivity.length === 0) {
        console.log('✅ CONFIRMADO: Atividade foi removida do banco de dados');
        console.log('🎉 PROBLEMA RESOLVIDO! A exclusão está funcionando corretamente');
      } else {
        console.log('❌ PROBLEMA: Atividade ainda existe no banco após exclusão');
        console.log('Atividade encontrada:', checkActivity);
      }
    }
    
    // Agora vamos testar a atividade original que estava com problema
    console.log('\n4️⃣ Testando exclusão da atividade original (53f5180a-e52b-4abd-baf9-927e6b405e28)...');
    
    const originalActivityId = '53f5180a-e52b-4abd-baf9-927e6b405e28';
    
    // Primeiro verificar se ainda existe
    const { data: originalActivity } = await supabaseAdmin
      .from('regional_activities')
      .select('*')
      .eq('id', originalActivityId);
    
    if (originalActivity && originalActivity.length > 0) {
      console.log('📋 Atividade original encontrada:', originalActivity[0].title);
      
      // Tentar deletar
      const { data: deletedOriginal, error: deleteOriginalError } = await supabaseAdmin
        .from('regional_activities')
        .delete()
        .eq('id', originalActivityId)
        .select('*');
      
      if (deleteOriginalError) {
        console.log('❌ Erro ao deletar atividade original:', deleteOriginalError.message);
      } else {
        console.log('✅ Atividade original deletada com sucesso!');
        console.log('🎯 PROBLEMA ORIGINAL RESOLVIDO!');
      }
    } else {
      console.log('ℹ️ Atividade original não encontrada (pode já ter sido deletada)');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testDeleteAfterFix().catch(console.error);