const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserMetadata() {
  console.log('🔧 Corrigindo user_metadata do usuário lemaestro@gerandofalcoes.com...\n');

  try {
    // Encontrar o usuário
    console.log('1. Buscando usuário...');
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
      return;
    }

    const targetUser = users.users.find(user => user.email === 'lemaestro@gerandofalcoes.com');
    
    if (!targetUser) {
      console.error('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado');
    console.log('📝 User Metadata atual:', JSON.stringify(targetUser.user_metadata, null, 2));

    // Atualizar user_metadata para usar 'super_admin' em vez de 'Super Admin'
    console.log('\n2. Atualizando user_metadata...');
    
    const updatedMetadata = {
      ...targetUser.user_metadata,
      role: 'super_admin' // Corrigir para usar underscore
    };

    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { 
        user_metadata: updatedMetadata
      }
    );

    if (updateError) {
      console.error('❌ Erro ao atualizar user_metadata:', updateError.message);
      return;
    }

    console.log('✅ User_metadata atualizado com sucesso!');
    console.log('📝 Novo user_metadata:', JSON.stringify(updatedMetadata, null, 2));

    // Verificar a atualização
    console.log('\n3. Verificando atualização...');
    const { data: verifyUsers, error: verifyError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (verifyError) {
      console.error('❌ Erro ao verificar:', verifyError.message);
      return;
    }

    const verifyUser = verifyUsers.users.find(user => user.email === 'lemaestro@gerandofalcoes.com');
    
    if (verifyUser) {
      console.log('✅ Verificação concluída:');
      console.log('📝 User Metadata verificado:', JSON.stringify(verifyUser.user_metadata, null, 2));
    }

    // Testar login novamente
    console.log('\n4. Testando login...');
    const supabaseClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: 'lemaestro@gerandofalcoes.com',
      password: 'SuperAdmin2024!'
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('🔑 Role no metadata:', loginData.user.user_metadata?.role);
      
      // Fazer logout
      await supabaseClient.auth.signOut();
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixUserMetadata();