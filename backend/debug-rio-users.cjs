const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugRioUsers() {
  try {
    console.log('🔍 Investigando usuários da regional Rio de Janeiro...\n');
    
    // 1. Verificar usuários em auth.users com Rio de Janeiro
    console.log('1️⃣ Verificando auth.users para Rio de Janeiro:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar auth.users:', authError);
      return;
    }
    
    const rioAuthUsers = authUsers.users.filter(user => {
      const regional = user.user_metadata?.regional;
      return regional && (
        regional.toLowerCase().includes('rio') || 
        regional.toLowerCase().includes('rj')
      );
    });
    
    console.log(`📊 Usuários encontrados em auth.users com Rio: ${rioAuthUsers.length}`);
    rioAuthUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   - regional: "${user.user_metadata?.regional}"`);
      console.log(`   - nome: "${user.user_metadata?.nome || user.user_metadata?.name}"`);
      console.log('');
    });
    
    // 2. Verificar usuários na tabela members com Rio de Janeiro
    console.log('\n2️⃣ Verificando tabela members para Rio de Janeiro:');
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .or('regional.ilike.%rio%,regional.ilike.%rj%');
    
    if (membersError) {
      console.error('❌ Erro ao buscar members:', membersError);
    } else {
      console.log(`📊 Usuários encontrados em members com Rio: ${members.length}`);
      members.forEach((member, index) => {
        console.log(`${index + 1}. ${member.email}`);
        console.log(`   - regional: "${member.regional}"`);
        console.log(`   - nome: "${member.nome}"`);
        console.log('');
      });
    }
    
    // 3. Verificar usuários na tabela usuarios com Rio de Janeiro
    console.log('\n3️⃣ Verificando tabela usuarios para Rio de Janeiro:');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .or('regional.ilike.%rio%,regional.ilike.%rj%');
    
    if (usuariosError) {
      console.error('❌ Erro ao buscar usuarios:', usuariosError);
    } else {
      console.log(`📊 Usuários encontrados em usuarios com Rio: ${usuarios.length}`);
      usuarios.forEach((usuario, index) => {
        console.log(`${index + 1}. ${usuario.email}`);
        console.log(`   - regional: "${usuario.regional}"`);
        console.log(`   - funcao: "${usuario.funcao}"`);
        console.log(`   - ativo: ${usuario.ativo}`);
        console.log('');
      });
    }
    
    // 4. Verificar variações exatas de "Rio de Janeiro"
    console.log('\n4️⃣ Verificando variações exatas de Rio de Janeiro em todas as tabelas:');
    
    const rioVariations = [
      'Rio de Janeiro',
      'rio de janeiro', 
      'RIO DE JANEIRO',
      'R. Rio de Janeiro',
      'Rio',
      'RJ'
    ];
    
    for (const variation of rioVariations) {
      console.log(`\n🔍 Buscando por: "${variation}"`);
      
      // auth.users
      const authRioUsers = authUsers.users.filter(user => 
        user.user_metadata?.regional === variation
      );
      console.log(`   auth.users: ${authRioUsers.length} usuários`);
      
      // members
      const { data: membersVariation } = await supabase
        .from('members')
        .select('email, regional, nome')
        .eq('regional', variation);
      console.log(`   members: ${membersVariation?.length || 0} usuários`);
      
      // usuarios
      const { data: usuariosVariation } = await supabase
        .from('usuarios')
        .select('email, regional, funcao')
        .eq('regional', variation);
      console.log(`   usuarios: ${usuariosVariation?.length || 0} usuários`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugRioUsers();