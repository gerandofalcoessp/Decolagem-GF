import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixMemberAuthId(memberEmail: string) {
  try {
    console.log(`🔍 Procurando membro com email: ${memberEmail}...`);

    // Buscar o membro na tabela members
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('email', memberEmail)
      .single();

    if (memberError) {
      console.error('❌ Erro ao buscar membro:', memberError.message);
      return;
    }

    if (!member) {
      console.error('❌ Membro não encontrado');
      return;
    }

    console.log(`📋 Membro encontrado: ${member.name} (ID: ${member.id})`);
    console.log(`🔑 Auth User ID atual: ${member.auth_user_id || 'null'}`);

    // Buscar o usuário no Supabase Auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erro ao buscar usuários de auth:', authError.message);
      return;
    }

    const authUser = authUsers.users.find(user => user.email === memberEmail);

    if (!authUser) {
      console.error('❌ Usuário de autenticação não encontrado');
      return;
    }

    console.log(`🔐 Usuário de auth encontrado: ${authUser.id}`);

    // Atualizar o membro com o auth_user_id correto
    const { data: updatedMember, error: updateError } = await supabaseAdmin
      .from('members')
      .update({ auth_user_id: authUser.id })
      .eq('id', member.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar membro:', updateError.message);
      return;
    }

    console.log('✅ Membro atualizado com sucesso!');
    console.log(`📋 Nome: ${updatedMember.name}`);
    console.log(`📧 Email: ${updatedMember.email}`);
    console.log(`🔑 Auth User ID: ${updatedMember.auth_user_id}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar para o email específico
const memberEmail = process.argv[2];

if (!memberEmail) {
  console.error('❌ Por favor, forneça o email do membro como argumento');
  console.log('Uso: npm run fix-member-auth-id <email>');
  process.exit(1);
}

fixMemberAuthId(memberEmail);