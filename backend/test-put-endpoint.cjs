const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPutEndpoint() {
  try {
    console.log('🔍 Testando endpoint PUT /api/regional-activities/:id');
    
    // Primeiro, fazer login para obter um token válido
    console.log('🔐 Fazendo login para obter token válido...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'lemaestro@gerandofalcoes.com',
      password: 'senha123' // Assumindo uma senha padrão
    });
    
    if (authError) {
      console.error('❌ Erro ao fazer login:', authError);
      return;
    }
    
    const token = authData.session?.access_token;
    if (!token) {
      console.error('❌ Token não encontrado na resposta de login');
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    
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
    
    // Simular dados que vêm do frontend
    const frontendData = {
      title: activity.title + ' (Atualizada)',
      description: activity.description || 'Descrição atualizada',
      type: activity.type,
      activity_date: activity.activity_date,
      responsavel_id: activity.responsavel_id,
      regional: activity.regional,
      programa: activity.programa || 'Programa Teste',
      estados: ['SP', 'RJ'], // Array como vem do frontend
      instituicaoId: activity.instituicao_id || '', // Campo com nome diferente
      quantidade: activity.quantidade || 10,
      atividadeLabel: 'Label Teste',
      atividadeCustomLabel: 'Custom Label Teste'
    };
    
    console.log('📤 Dados simulados do frontend:', JSON.stringify(frontendData, null, 2));
    
    // Fazer requisição PUT para o endpoint
    const response = await fetch(`http://localhost:4000/api/regional-activities/${activity.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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
      instituicao_id: updatedActivity.instituicao_id
    });
    
    console.log('🎉 Teste do endpoint PUT concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testPutEndpoint();