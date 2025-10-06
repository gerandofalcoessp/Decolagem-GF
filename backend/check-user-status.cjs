const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkUserStatus() {
  console.log('🔍 Verificando status dos usuários no banco de dados...\n');

  try {
    // 1. Verificar dados na tabela usuarios
    console.log('1. Verificando tabela usuarios...');
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (usuariosError) {
      console.error('❌ Erro ao buscar usuarios:', usuariosError);
      return;
    }

    console.log(`✅ Encontrados ${usuarios.length} usuários na tabela usuarios:`);
    console.log('\n📋 DADOS DA TABELA USUARIOS:');
    usuarios.forEach((usuario, index) => {
      console.log(`${index + 1}. ${usuario.nome} (${usuario.email})`);
      console.log(`   - ID: ${usuario.id}`);
      console.log(`   - Auth User ID: ${usuario.auth_user_id}`);
      console.log(`   - Role: ${usuario.role}`);
      console.log(`   - Permissão: ${usuario.permissao}`);
      console.log(`   - Status: ${usuario.status}`);
      console.log(`   - Regional: ${usuario.regional || 'N/A'}`);
      console.log(`   - Função: ${usuario.funcao || 'N/A'}`);
      console.log(`   - Área: ${usuario.area || 'N/A'}`);
      console.log(`   - Criado em: ${usuario.created_at}`);
      console.log(`   - Atualizado em: ${usuario.updated_at}`);
      console.log('');
    });

    // 2. Verificar dados na tabela auth.users
    console.log('\n2. Verificando tabela auth.users...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erro ao buscar auth.users:', authError);
      return;
    }

    console.log(`✅ Encontrados ${authData.users.length} usuários na tabela auth.users:`);
    console.log('\n📋 DADOS DA TABELA AUTH.USERS:');
    authData.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
      console.log(`   - Último login: ${user.last_sign_in_at || 'Nunca'}`);
      console.log(`   - Banido até: ${user.banned_until || 'Não banido'}`);
      console.log(`   - User metadata:`, JSON.stringify(user.user_metadata, null, 4));
      console.log('');
    });

    // 3. Comparar dados entre as tabelas
    console.log('\n3. Comparando dados entre tabelas...');
    console.log('\n📊 COMPARAÇÃO DE STATUS:');
    
    for (const usuario of usuarios) {
      const authUser = authData.users.find(u => u.id === usuario.auth_user_id);
      
      console.log(`👤 ${usuario.nome} (${usuario.email}):`);
      console.log(`   - Status na tabela usuarios: ${usuario.status}`);
      console.log(`   - Email confirmado no auth: ${authUser?.email_confirmed_at ? 'Sim' : 'Não'}`);
      console.log(`   - Banido no auth: ${authUser?.banned_until ? 'Sim' : 'Não'}`);
      console.log(`   - Role na tabela usuarios: ${usuario.role}`);
      console.log(`   - Permissão na tabela usuarios: ${usuario.permissao}`);
      console.log(`   - Role no user_metadata: ${authUser?.user_metadata?.role || 'N/A'}`);
      
      // Verificar inconsistências
      const inconsistencias = [];
      
      if (usuario.status === 'inativo' && authUser?.email_confirmed_at) {
        inconsistencias.push('Status inativo mas email confirmado');
      }
      
      if (usuario.status === 'ativo' && !authUser?.email_confirmed_at) {
        inconsistencias.push('Status ativo mas email não confirmado');
      }
      
      if (usuario.role !== usuario.permissao) {
        inconsistencias.push(`Role (${usuario.role}) diferente de permissão (${usuario.permissao})`);
      }
      
      if (usuario.role !== authUser?.user_metadata?.role) {
        inconsistencias.push(`Role na tabela (${usuario.role}) diferente do user_metadata (${authUser?.user_metadata?.role})`);
      }
      
      if (inconsistencias.length > 0) {
        console.log(`   ⚠️  INCONSISTÊNCIAS:`);
        inconsistencias.forEach(inc => console.log(`      - ${inc}`));
      } else {
        console.log(`   ✅ Dados consistentes`);
      }
      
      console.log('');
    }

    // 4. Resumo final
    console.log('\n📊 RESUMO:');
    const ativos = usuarios.filter(u => u.status === 'ativo').length;
    const inativos = usuarios.filter(u => u.status === 'inativo').length;
    const emailsConfirmados = usuarios.filter(u => {
      const authUser = authData.users.find(au => au.id === u.auth_user_id);
      return authUser?.email_confirmed_at;
    }).length;
    
    console.log(`- Total de usuários: ${usuarios.length}`);
    console.log(`- Status "ativo" na tabela usuarios: ${ativos}`);
    console.log(`- Status "inativo" na tabela usuarios: ${inativos}`);
    console.log(`- Emails confirmados no auth: ${emailsConfirmados}`);
    console.log(`- Emails não confirmados no auth: ${usuarios.length - emailsConfirmados}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUserStatus();