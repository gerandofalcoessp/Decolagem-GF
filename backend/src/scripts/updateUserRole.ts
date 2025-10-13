import 'dotenv/config';
import { supabaseAdmin } from '../services/supabaseClient.js';

async function updateUserRole(email: string, newRole: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin não configurado. Verifique as variáveis de ambiente.');
  }

  console.log(`🔧 Atualizando role do usuário: ${email} para ${newRole}`);

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

    console.log(`📋 Usuário encontrado: ${user.id}`);
    console.log(`📋 Role atual: ${user.user_metadata?.role || 'Não definida'}`);

    // Atualizar o user_metadata
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        role: newRole
      }
    });

    if (error) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }

    console.log(`✅ Role atualizada com sucesso para: ${newRole}`);
    console.log(`📋 Dados atualizados:`, data.user.user_metadata);

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// CLI
async function main() {
  const email = process.argv[2];
  const newRole = process.argv[3];
  
  if (!email || !newRole) {
    console.error('❌ Email e nova role são obrigatórios');
    console.log('Uso: npm run update-user-role <email> <role>');
    console.log('Exemplo: npm run update-user-role flavio.almeida@gerandofalcoes.com super_admin');
    process.exit(1);
  }

  await updateUserRole(email, newRole);
}

main().catch((error) => {
  console.error('💥 Erro fatal:', error.message);
  process.exit(1);
});