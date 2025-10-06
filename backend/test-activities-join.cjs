const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testActivitiesEndpoint() {
  try {
    console.log('🧪 Testando o endpoint de activities com join...');
    
    // Primeiro, vamos buscar um usuário válido
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, nome')
      .limit(1);
      
    if (usuariosError || !usuarios || usuarios.length === 0) {
      console.log('❌ Nenhum usuário encontrado para teste');
      return;
    }
    
    const usuario = usuarios[0];
    console.log('✅ Usuário encontrado:', usuario.nome, '(ID:', usuario.id + ')');
    
    // Buscar um member válido
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id')
      .limit(1);
      
    if (membersError || !members || members.length === 0) {
      console.log('❌ Nenhum member encontrado para teste');
      return;
    }
    
    const member = members[0];
    console.log('✅ Member encontrado:', member.id);
    
    // Criar uma atividade de teste com responsavel_id
    const testActivity = {
      title: 'Atividade Teste com Responsável',
      description: 'Teste do join com usuários',
      member_id: member.id,
      responsavel_id: usuario.id
    };
    
    console.log('📝 Criando atividade de teste...');
    const { data: insertData, error: insertError } = await supabase
      .from('activities')
      .insert(testActivity)
      .select();
      
    if (insertError) {
      console.error('❌ Erro ao criar atividade:', insertError.message);
      return;
    }
    
    console.log('✅ Atividade criada com ID:', insertData[0].id);
    
    // Agora testar o join
    console.log('🔍 Testando o join com usuarios...');
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
      .eq('id', insertData[0].id);
      
    if (joinError) {
      console.error('❌ Erro no join:', joinError.message);
    } else {
      console.log('✅ Join funcionando!');
      console.log('📋 Dados da atividade com responsável:');
      console.log('- Título:', joinData[0].title);
      console.log('- Responsável:', joinData[0].responsavel?.nome || 'Não encontrado');
      console.log('- Email do responsável:', joinData[0].responsavel?.email || 'N/A');
      console.log('- Regional:', joinData[0].responsavel?.regional || 'N/A');
    }
    
    // Limpar o teste
    await supabase.from('activities').delete().eq('id', insertData[0].id);
    console.log('🧹 Atividade de teste removida');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testActivitiesEndpoint();