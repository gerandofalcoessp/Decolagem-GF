import 'dotenv/config';
import { supabaseAdmin } from '../services/supabaseClient.js';

async function checkUserMetadata(email: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin não configurado. Verifique as variáveis de ambiente.');
  }

  console.log(`🔍 Verificando user_metadata para: ${email}`);

  try {
    // Buscar usuário por email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Erro ao listar usuários: ${listError.message}`);
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('\n📋 Dados do usuário:');
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
    console.log(`Email confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
    
    console.log('\n🔧 User Metadata:');
    if (user.user_metadata && Object.keys(user.user_metadata).length > 0) {
      Object.entries(user.user_metadata).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    } else {
      console.log('  Nenhum metadata encontrado');
    }

    // Verificar se existe entrada na tabela members
    console.log('\n👤 Verificando entrada na tabela members:');
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (memberError) {
      console.log('❌ Erro ao buscar member ou member não encontrado:', memberError.message);
    } else {
      console.log('✅ Member encontrado:');
      console.log(`  ID: ${memberData.id}`);
      console.log(`  Nome: ${memberData.name}`);
      console.log(`  Email: ${memberData.email}`);
      console.log(`  Regional ID: ${memberData.regional_id}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// CLI
async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Email é obrigatório');
    console.log('Uso: npm run check-user-metadata <email>');
    console.log('Exemplo: npm run check-user-metadata flavio.almeida@gerandofalcoes.com');
    process.exit(1);
  }

  await checkUserMetadata(email);
}

main().catch((error) => {
  console.error('💥 Erro fatal:', error.message);
  process.exit(1);
});