const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugCurrentUser() {
  try {
    console.log('🔍 Investigando usuário atual logado...');
    
    // Buscar na tabela auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários auth:', authError);
      return;
    }
    
    console.log('📊 Total de usuários auth:', authUsers.users.length);
    console.log('');
    
    // Buscar usuários que podem ser "Nordeste 2"
    const nordeste2AuthUsers = authUsers.users.filter(u => 
      u.user_metadata?.regional && (
        u.user_metadata.regional.toLowerCase().includes('nordeste 2') ||
        u.user_metadata.regional.toLowerCase().includes('nordeste_2') ||
        u.user_metadata.regional.toLowerCase() === 'r. nordeste 2'
      )
    );
    
    console.log('👤 Usuários auth com regional Nordeste 2:');
    nordeste2AuthUsers.forEach(user => {
      console.log(`   - ${user.email}`);
      console.log(`     Regional: "${user.user_metadata?.regional}"`);
      console.log(`     Nome: "${user.user_metadata?.nome || 'N/A'}"`);
      console.log(`     Role: "${user.user_metadata?.role || 'N/A'}"`);
      console.log('');
    });
    
    // Buscar todos os usuários auth para ver as regionais disponíveis
    console.log('🏢 Todas as regionais encontradas nos usuários auth:');
    const regionais = new Set();
    authUsers.users.forEach(user => {
      if (user.user_metadata?.regional) {
        regionais.add(user.user_metadata.regional);
      }
    });
    
    Array.from(regionais).sort().forEach(regional => {
      console.log(`   - "${regional}"`);
    });
    
    console.log('');
    
    // Verificar se há correspondência entre auth.users e members
    console.log('🔗 Verificando correspondência entre auth.users e members...');
    
    for (const authUser of authUsers.users) {
      if (authUser.user_metadata?.regional?.toLowerCase().includes('nordeste')) {
        console.log(`\n👤 Auth User: ${authUser.email}`);
        console.log(`   Regional auth: "${authUser.user_metadata.regional}"`);
        
        // Buscar correspondente na tabela members
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .single();
        
        if (member) {
          console.log(`   ✅ Member encontrado:`);
          console.log(`      Regional member: "${member.regional}"`);
          console.log(`      Nome: "${member.nome}"`);
          console.log(`      Area: "${member.area || 'N/A'}"`);
        } else {
          console.log(`   ❌ Member não encontrado`);
          if (memberError) {
            console.log(`      Erro: ${memberError.message}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugCurrentUser();