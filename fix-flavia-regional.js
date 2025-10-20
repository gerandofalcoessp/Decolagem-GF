const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixFlaviaRegional() {
  try {
    console.log('🔧 Atualizando campo regional da Flávia Silva...\n');
    
    // 1. Verificar dados atuais da Flávia
    console.log('1️⃣ Dados atuais da Flávia:');
    const { data: flaviaMembers, error: flaviaError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('auth_user_id', '5eedfafe-fb84-4871-83f2-1dcd5be3f283');
    
    if (flaviaError) {
      console.error('❌ Erro ao buscar Flávia:', flaviaError);
      return;
    }
    
    if (flaviaMembers.length === 0) {
      console.log('❌ Flávia não encontrada na tabela members');
      return;
    }
    
    const flavia = flaviaMembers[0];
    console.log(`👤 Flávia Silva (ID: ${flavia.id})`);
    console.log(`   - Email: ${flavia.email}`);
    console.log(`   - Regional atual: ${flavia.regional || 'null'}`);
    console.log(`   - Área atual: ${flavia.area || 'null'}`);
    
    // 2. Atualizar o campo regional
    console.log('\n2️⃣ Atualizando campo regional...');
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('members')
      .update({
        regional: 'R. Rio de Janeiro',
        area: 'Rio de Janeiro'
      })
      .eq('id', flavia.id)
      .select();
    
    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError);
      return;
    }
    
    console.log('✅ Campo regional atualizado com sucesso!');
    console.log(`   - Nova regional: ${updateData[0].regional}`);
    console.log(`   - Nova área: ${updateData[0].area}`);
    
    // 3. Verificar se agora ela pode ver metas relacionadas ao Rio
    console.log('\n3️⃣ Verificando metas relacionadas ao Rio de Janeiro...');
    const { data: rioGoals, error: rioGoalsError } = await supabaseAdmin
      .from('goals')
      .select('*')
      .or('descricao.ilike.%rio%,descricao.ilike.%rj%');
    
    if (!rioGoalsError && rioGoals.length > 0) {
      console.log(`📊 Metas relacionadas ao Rio: ${rioGoals.length}`);
      rioGoals.forEach((meta, index) => {
        console.log(`${index + 1}. ${meta.nome}`);
        console.log(`   - Descrição: ${meta.descricao}`);
        console.log('');
      });
    }
    
    console.log('\n✅ Correção aplicada! Agora a Flávia deve conseguir ver as metas do Rio de Janeiro.');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixFlaviaRegional();