const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkGoalsStructure() {
  console.log('🔍 Verificando estrutura da tabela goals...\n');
  
  try {
    // 1. Verificar uma meta de exemplo para ver todos os campos
    const { data: sampleGoal, error: sampleError } = await supabase
      .from('goals')
      .select('*')
      .limit(1)
      .single();
      
    if (sampleError) {
      console.error('❌ Erro ao buscar meta de exemplo:', sampleError);
    } else {
      console.log('📝 Campos de uma meta de exemplo:');
      Object.keys(sampleGoal).forEach(key => {
        console.log(`  - ${key}: ${sampleGoal[key]}`);
      });
    }
    
    // 2. Verificar se há algum padrão na descrição que indique visibilidade
    const { data: allGoals, error: allError } = await supabase
      .from('goals')
      .select('id, nome, descricao, member_id');
      
    if (allError) {
      console.error('❌ Erro ao buscar todas as metas:', allError);
    } else {
      console.log(`\n📊 Total de metas: ${allGoals.length}`);
      
      // Verificar padrões na descrição
      const descricaoPatterns = {};
      allGoals.forEach(goal => {
        if (goal.descricao) {
          // Procurar por palavras-chave relacionadas à visibilidade
          const desc = goal.descricao.toLowerCase();
          if (desc.includes('todas')) descricaoPatterns['todas'] = (descricaoPatterns['todas'] || 0) + 1;
          if (desc.includes('nacional')) descricaoPatterns['nacional'] = (descricaoPatterns['nacional'] || 0) + 1;
          if (desc.includes('global')) descricaoPatterns['global'] = (descricaoPatterns['global'] || 0) + 1;
          if (desc.includes('público')) descricaoPatterns['público'] = (descricaoPatterns['público'] || 0) + 1;
          if (desc.includes('geral')) descricaoPatterns['geral'] = (descricaoPatterns['geral'] || 0) + 1;
        }
      });
      
      console.log('\n🔍 Padrões encontrados nas descrições:');
      Object.entries(descricaoPatterns).forEach(([pattern, count]) => {
        console.log(`  - ${pattern}: ${count} ocorrências`);
      });
      
      // Verificar distribuição por member_id
      const memberDistribution = {};
      allGoals.forEach(goal => {
        const memberId = goal.member_id;
        memberDistribution[memberId] = (memberDistribution[memberId] || 0) + 1;
      });
      
      console.log('\n👥 Distribuição por member_id:');
      Object.entries(memberDistribution).forEach(([memberId, count]) => {
        console.log(`  - ${memberId}: ${count} metas`);
      });
      
      // 3. Analisar algumas metas específicas para entender o padrão
      console.log('\n📋 Análise de metas específicas:');
      const metasComTodas = allGoals.filter(goal => 
        goal.descricao && goal.descricao.toLowerCase().includes('todas')
      );
      
      console.log(`\n🎯 Metas com "todas" na descrição: ${metasComTodas.length}`);
      metasComTodas.slice(0, 3).forEach((goal, index) => {
        console.log(`  ${index + 1}. ${goal.nome}`);
        console.log(`     Descrição: ${goal.descricao}`);
        console.log(`     Member ID: ${goal.member_id}`);
      });
      
      const metasComNacional = allGoals.filter(goal => 
        goal.descricao && goal.descricao.toLowerCase().includes('nacional')
      );
      
      console.log(`\n🌍 Metas com "nacional" na descrição: ${metasComNacional.length}`);
      metasComNacional.slice(0, 3).forEach((goal, index) => {
        console.log(`  ${index + 1}. ${goal.nome}`);
        console.log(`     Descrição: ${goal.descricao}`);
        console.log(`     Member ID: ${goal.member_id}`);
      });
    }
    
    // 4. Verificar informações do member que criou as metas
    console.log('\n👤 Informações do member que criou as metas:');
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', '3450ebb4-6e86-475a-9443-ed84369c5184')
      .single();
      
    if (memberError) {
      console.error('❌ Erro ao buscar member:', memberError);
    } else {
      console.log('📋 Dados do member:');
      Object.keys(member).forEach(key => {
        console.log(`  - ${key}: ${member[key]}`);
      });
    }
    
    // 5. Verificar usuário associado ao member
    if (member && member.auth_user_id) {
      console.log('\n🔐 Verificando usuário associado...');
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(member.auth_user_id);
      
      if (userError) {
        console.error('❌ Erro ao buscar usuário:', userError);
      } else {
        console.log('👤 Dados do usuário:');
        console.log(`  - Email: ${user.user.email}`);
        console.log(`  - Role: ${user.user.user_metadata?.role || 'N/A'}`);
        console.log(`  - Regional: ${user.user.user_metadata?.regional || 'N/A'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkGoalsStructure().catch(console.error);