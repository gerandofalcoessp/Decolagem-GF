const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testFlaviaAfterFix() {
  try {
    console.log('🧪 Testando login da Flávia após correção...\n');
    
    // 1. Fazer login com Flávia
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'flavia.silva@gerandofalcoes.com',
      password: '123456'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log(`👤 Usuário: ${authData.user.email}`);
    console.log(`🔑 Role: ${authData.user.user_metadata?.role}`);
    console.log(`🌍 Regional: ${authData.user.user_metadata?.regional}`);
    
    // 2. Buscar dados do member atualizado
    console.log('\n📋 Dados do member:');
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();
    
    if (memberError) {
      console.error('❌ Erro ao buscar member:', memberError);
    } else {
      console.log(`   - ID: ${memberData.id}`);
      console.log(`   - Nome: ${memberData.nome}`);
      console.log(`   - Regional: ${memberData.regional}`);
      console.log(`   - Área: ${memberData.area}`);
    }
    
    // 3. Buscar metas através da API
    console.log('\n🎯 Testando busca de metas através da API...');
    
    const response = await fetch('http://localhost:4000/api/goals', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Erro na API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Detalhes:', errorText);
      return;
    }
    
    const apiResult = await response.json();
    console.log(`📊 Metas encontradas: ${apiResult.data?.length || 0}`);
    
    if (apiResult.data && apiResult.data.length > 0) {
      console.log('\n🎯 Metas visíveis para Flávia:');
      apiResult.data.forEach((meta, index) => {
        console.log(`${index + 1}. ${meta.nome}`);
        console.log(`   - Descrição: ${meta.descricao?.substring(0, 100)}...`);
        console.log(`   - Criador: ${meta.member_id}`);
        console.log('');
      });
      
      // Verificar se há metas do Rio de Janeiro
      const rioMetas = apiResult.data.filter(meta => 
        meta.descricao?.toLowerCase().includes('rio de janeiro') ||
        meta.descricao?.toLowerCase().includes('rio') ||
        meta.nome?.toLowerCase().includes('rio')
      );
      
      console.log(`🏙️ Metas relacionadas ao Rio de Janeiro: ${rioMetas.length}`);
      if (rioMetas.length > 0) {
        console.log('✅ SUCESSO! Flávia agora consegue ver as metas do Rio de Janeiro!');
      } else {
        console.log('⚠️ Ainda não há metas específicas do Rio visíveis para Flávia.');
      }
    } else {
      console.log('❌ Nenhuma meta encontrada para Flávia.');
    }
    
    // 4. Fazer logout
    await supabase.auth.signOut();
    console.log('\n🚪 Logout realizado.');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testFlaviaAfterFix();