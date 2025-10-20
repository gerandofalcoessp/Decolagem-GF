const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFlaviaUser() {
  try {
    console.log('🔍 Verificando usuário flavia.silva@gerandofalcoes.com...\n');
    
    // 1. Verificar na tabela usuarios
    console.log('1️⃣ Verificando na tabela usuarios:');
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .ilike('email', '%flavia%');
    
    if (usuariosError) {
      console.error('❌ Erro ao buscar na tabela usuarios:', usuariosError);
    } else {
      console.log(`📊 Usuários encontrados com "flavia": ${usuarios.length}`);
      usuarios.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   - nome: "${user.nome}"`);
        console.log(`   - regional: "${user.regional}"`);
        console.log(`   - role: "${user.role || user.permissao}"`);
        console.log(`   - auth_user_id: "${user.auth_user_id}"`);
        console.log('');
      });
    }
    
    // 2. Verificar na tabela members
    console.log('\n2️⃣ Verificando na tabela members:');
    const { data: members, error: membersError } = await supabaseAdmin
      .from('members')
      .select('*')
      .or('email.ilike.%flavia%,name.ilike.%flavia%,nome.ilike.%flavia%');
    
    if (membersError) {
      console.error('❌ Erro ao buscar na tabela members:', membersError);
    } else {
      console.log(`📊 Members encontrados com "flavia": ${members.length}`);
      members.forEach((member, index) => {
        console.log(`${index + 1}. ${member.email || member.name || member.nome}`);
        console.log(`   - nome: "${member.name || member.nome}"`);
        console.log(`   - regional: "${member.regional}"`);
        console.log(`   - area: "${member.area}"`);
        console.log(`   - auth_user_id: "${member.auth_user_id}"`);
        console.log('');
      });
    }
    
    // 3. Verificar no Supabase Auth
    console.log('\n3️⃣ Verificando no Supabase Auth:');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar no Auth:', authError);
    } else {
      const flaviaAuthUsers = authUsers.users.filter(user => 
        user.email && user.email.toLowerCase().includes('flavia')
      );
      
      console.log(`📊 Usuários Auth encontrados com "flavia": ${flaviaAuthUsers.length}`);
      flaviaAuthUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   - id: "${user.id}"`);
        console.log(`   - confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
        console.log(`   - último login: ${user.last_sign_in_at || 'Nunca'}`);
        console.log(`   - metadata:`, user.user_metadata);
        console.log('');
      });
    }
    
    // 4. Verificar usuários do Rio de Janeiro
    console.log('\n4️⃣ Verificando usuários do Rio de Janeiro:');
    
    // Na tabela usuarios
    const { data: rioUsuarios, error: rioUsuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .or('regional.ilike.%rio%,regional.ilike.%rj%');
    
    if (!rioUsuariosError && rioUsuarios.length > 0) {
      console.log(`📊 Usuários do Rio na tabela usuarios: ${rioUsuarios.length}`);
      rioUsuarios.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   - nome: "${user.nome}"`);
        console.log(`   - regional: "${user.regional}"`);
        console.log('');
      });
    }
    
    // Na tabela members
    const { data: rioMembers, error: rioMembersError } = await supabaseAdmin
      .from('members')
      .select('*')
      .or('regional.ilike.%rio%,area.ilike.%rio%');
    
    if (!rioMembersError && rioMembers.length > 0) {
      console.log(`📊 Members do Rio: ${rioMembers.length}`);
      rioMembers.forEach((member, index) => {
        console.log(`${index + 1}. ${member.email || member.name || member.nome}`);
        console.log(`   - regional: "${member.regional}"`);
        console.log(`   - area: "${member.area}"`);
        console.log('');
      });
    }
    
    // 5. Sugerir usuários de teste
    console.log('\n5️⃣ Sugestões de usuários para teste:');
    
    // Buscar usuários com regional definida
    const { data: allUsuarios, error: allError } = await supabaseAdmin
      .from('usuarios')
      .select('email, nome, regional, role, permissao')
      .not('regional', 'is', null)
      .limit(10);
    
    if (!allError && allUsuarios.length > 0) {
      console.log('Usuários disponíveis para teste:');
      allUsuarios.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   - nome: "${user.nome}"`);
        console.log(`   - regional: "${user.regional}"`);
        console.log(`   - role: "${user.role || user.permissao}"`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkFlaviaUser();