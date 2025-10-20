const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserInUsuarios() {
  try {
    console.log('🔍 Verificando usuários na tabela usuarios...\n');
    
    // Buscar todos os usuários na tabela usuarios
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }
    
    if (!usuarios || usuarios.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado na tabela usuarios');
      return;
    }
    
    console.log(`✅ ${usuarios.length} usuários encontrados na tabela usuarios:`);
    console.log('='.repeat(60));
    
    usuarios.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Nome: ${user.nome}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role/Permissão: ${user.role || user.permissao || 'N/A'}`);
      console.log(`   Auth User ID: ${user.auth_user_id || 'N/A'}`);
      console.log(`   Status: ${user.status || 'N/A'}`);
      console.log(`   Regional: ${user.regional || 'N/A'}`);
      console.log(`   Função: ${user.funcao || 'N/A'}`);
      console.log(`   Criado em: ${user.created_at || 'N/A'}`);
      console.log('-'.repeat(40));
    });
    
    // Verificar se existe algum usuário com super_admin
    const superAdmins = usuarios.filter(u => u.role === 'super_admin' || u.permissao === 'super_admin');
    console.log(`\n🔑 Usuários com role super_admin: ${superAdmins.length}`);
    
    // Verificar se existe algum usuário com equipe_interna
    const equipeInterna = usuarios.filter(u => u.role === 'equipe_interna' || u.permissao === 'equipe_interna');
    console.log(`👥 Usuários com role equipe_interna: ${equipeInterna.length}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkUserInUsuarios();