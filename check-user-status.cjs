const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserStatus() {
  try {
    console.log('🔍 Verificando status dos usuários na tabela usuarios...\n');
    
    // Buscar todos os usuários
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, status')
      .order('nome');

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }

    if (!usuarios || usuarios.length === 0) {
      console.log('❌ Nenhum usuário encontrado na tabela usuarios');
      return;
    }

    console.log(`📊 Total de usuários encontrados: ${usuarios.length}\n`);
    
    // Contar status
    const statusCount = {};
    usuarios.forEach(user => {
      const status = user.status || 'null';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    console.log('📈 Contagem por status:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} usuários`);
    });

    console.log('\n📋 Lista de usuários com seus status:');
    usuarios.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nome} (${user.email}) - Status: "${user.status}"`);
    });

    // Verificar também na tabela members
    console.log('\n🔍 Verificando status na tabela members...\n');
    
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, user_id, status')
      .order('id');

    if (membersError) {
      console.error('❌ Erro ao buscar members:', membersError);
      return;
    }

    if (members && members.length > 0) {
      console.log(`📊 Total de members encontrados: ${members.length}\n`);
      
      const membersStatusCount = {};
      members.forEach(member => {
        const status = member.status || 'null';
        membersStatusCount[status] = (membersStatusCount[status] || 0) + 1;
      });

      console.log('📈 Contagem por status na tabela members:');
      Object.entries(membersStatusCount).forEach(([status, count]) => {
        console.log(`  ${status}: ${count} members`);
      });

      console.log('\n📋 Lista de members com seus status:');
      members.slice(0, 10).forEach((member, index) => {
        console.log(`${index + 1}. Member ID: ${member.id}, User ID: ${member.user_id} - Status: "${member.status}"`);
      });
      
      if (members.length > 10) {
        console.log(`... e mais ${members.length - 10} members`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUserStatus();