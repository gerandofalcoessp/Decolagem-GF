const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPutEndpointSimple() {
  try {
    console.log('🔍 Testando endpoint PUT /api/regional-activities/:id (modo simples)');
    
    // Buscar uma atividade existente para testar
    const { data: activities, error: fetchError } = await supabase
      .from('regional_activities')
      .select('*')
      .limit(1);
      
    if (fetchError) {
      console.error('❌ Erro ao buscar atividades:', fetchError);
      return;
    }
    
    if (!activities || activities.length === 0) {
      console.log('⚠️ Nenhuma atividade encontrada para testar');
      return;
    }
    
    const activity = activities[0];
    console.log('📋 Atividade encontrada para teste:', {
      id: activity.id,
      title: activity.title,
      type: activity.type,
      regional: activity.regional
    });
    
    // Simular dados que vêm do frontend (FormData convertido para JSON)
    const frontendData = {
      title: activity.title + ' (Teste PUT)',
      description: activity.description || 'Descrição atualizada via teste',
      type: activity.type,
      activity_date: activity.activity_date,
      responsavel_id: activity.responsavel_id,
      regional: activity.regional,
      programa: 'Programa Atualizado',
      estados: JSON.stringify(['SP', 'RJ']), // Como vem do FormData
      instituicaoId: activity.instituicao_id || '',
      quantidade: '15', // Como string do FormData
      atividadeLabel: 'Label Atualizada',
      atividadeCustomLabel: 'Custom Label Atualizada'
    };
    
    console.log('📤 Dados simulados do frontend (FormData):', JSON.stringify(frontendData, null, 2));
    
    // Fazer requisição PUT diretamente usando fetch
    const response = await fetch(`http://localhost:4000/api/regional-activities/${activity.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Usar um token de usuário válido - vamos usar o service key temporariamente
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify(frontendData)
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erro na requisição PUT:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData
      });
      return;
    }
    
    console.log('✅ Requisição PUT bem-sucedida!');
    console.log('📋 Dados retornados:', JSON.stringify(responseData, null, 2));
    
    // Verificar se os dados foram realmente atualizados no banco
    const { data: updatedActivity, error: verifyError } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('id', activity.id)
      .single();
      
    if (verifyError) {
      console.error('❌ Erro ao verificar atualização:', verifyError);
      return;
    }
    
    console.log('🔍 Verificação no banco - atividade atualizada:', {
      id: updatedActivity.id,
      title: updatedActivity.title,
      description: updatedActivity.description,
      programa: updatedActivity.programa,
      estados: updatedActivity.estados,
      instituicao_id: updatedActivity.instituicao_id,
      quantidade: updatedActivity.quantidade
    });
    
    console.log('🎉 Teste do endpoint PUT concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testPutEndpointSimple();