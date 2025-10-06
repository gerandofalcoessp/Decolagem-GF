const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela activities...');
    
    // Tentar buscar dados primeiro
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Erro ao buscar dados:', error);
    }
    
    if (data && data.length > 0) {
      console.log('📋 Colunas encontradas (com dados):');
      Object.keys(data[0]).forEach(key => {
        console.log('- ' + key + ':', typeof data[0][key]);
      });
    } else {
      console.log('📋 Tabela vazia ou sem dados');
    }
    
    // Tentar inserir um registro de teste para ver a estrutura
    console.log('\n🧪 Testando inserção para verificar estrutura...');
    
    // Primeiro, buscar um member_id válido
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id')
      .limit(1);
      
    if (membersError || !members || members.length === 0) {
      console.log('❌ Não foi possível encontrar um member_id válido');
      return;
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('activities')
      .insert({
        member_id: members[0].id,
        title: 'TESTE_ESTRUTURA',
        description: 'Teste para verificar estrutura'
      })
      .select();
      
    if (insertError) {
      console.log('❌ Erro na inserção (isso nos ajuda a ver a estrutura):');
      console.log(insertError.message);
      console.log('Detalhes:', insertError.details);
    } else if (insertData) {
      console.log('✅ Inserção bem-sucedida, estrutura:');
      Object.keys(insertData[0]).forEach(key => {
        console.log('- ' + key + ':', typeof insertData[0][key]);
      });
      
      // Remover o registro de teste
      await supabase
        .from('activities')
        .delete()
        .eq('title', 'TESTE_ESTRUTURA');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkStructure();