const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDeiseCredentials() {
  console.log('🔍 Verificando credenciais da Deise...\n');

  try {
    // 1. Buscar Deise na tabela members
    console.log('1. Buscando Deise na tabela members...');
    
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .ilike('name', '%deise%');

    if (membersError) {
      console.error('❌ Erro ao buscar members:', membersError.message);
      return;
    }

    console.log('✅ Membros encontrados:', members.length);
    
    if (members.length === 0) {
      console.log('❌ Nenhum membro com nome Deise encontrado');
      return;
    }

    const deise = members[0];
    console.log('   ID:', deise.id);
    console.log('   Nome:', deise.name);
    console.log('   Email:', deise.email);
    console.log('   Auth User ID:', deise.auth_user_id);
    console.log('   Regional:', deise.regional);
    console.log('   Área:', deise.area);

    // 2. Verificar se existe usuário no auth
    console.log('\n2. Verificando usuário no auth...');
    
    if (deise.auth_user_id) {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(deise.auth_user_id);
      
      if (authError) {
        console.log('❌ Usuário não encontrado no auth:', authError.message);
      } else {
        console.log('✅ Usuário encontrado no auth');
        console.log('   ID:', authUser.user.id);
        console.log('   Email:', authUser.user.email);
        console.log('   Confirmado:', authUser.user.email_confirmed_at ? 'SIM' : 'NÃO');
        console.log('   Criado em:', authUser.user.created_at);
        
        // Tentar fazer login
        console.log('\n3. Testando login com credenciais existentes...');
        
        const testClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);
        
        const { data: loginData, error: loginError } = await testClient.auth.signInWithPassword({
          email: deise.email,
          password: 'senha123'
        });

        if (loginError) {
          console.log('❌ Login falhou:', loginError.message);
          
          // Tentar resetar a senha
          console.log('\n4. Tentando resetar senha...');
          
          const { data: resetData, error: resetError } = await supabase.auth.admin.updateUserById(
            deise.auth_user_id,
            { password: 'senha123' }
          );

          if (resetError) {
            console.error('❌ Erro ao resetar senha:', resetError.message);
          } else {
            console.log('✅ Senha resetada com sucesso');
            
            // Testar login novamente
            console.log('\n5. Testando login após reset...');
            
            const { data: newLoginData, error: newLoginError } = await testClient.auth.signInWithPassword({
              email: deise.email,
              password: 'senha123'
            });

            if (newLoginError) {
              console.log('❌ Login ainda falha:', newLoginError.message);
            } else {
              console.log('✅ Login funcionou após reset da senha!');
              console.log('   User ID:', newLoginData.user.id);
            }
          }
        } else {
          console.log('✅ Login funcionou com credenciais existentes!');
          console.log('   User ID:', loginData.user.id);
        }
        
        return;
      }
    }

    // 3. Se não existe usuário no auth, criar um
    console.log('\n3. Criando usuário no auth...');
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: deise.email,
      password: 'senha123',
      email_confirm: true
    });

    if (createError) {
      console.error('❌ Erro ao criar usuário:', createError.message);
      return;
    }

    console.log('✅ Usuário criado no auth');
    console.log('   ID:', newUser.user.id);
    console.log('   Email:', newUser.user.email);

    // 4. Atualizar auth_user_id na tabela members
    console.log('\n4. Atualizando auth_user_id na tabela members...');
    
    const { error: updateError } = await supabase
      .from('members')
      .update({ auth_user_id: newUser.user.id })
      .eq('id', deise.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar member:', updateError.message);
    } else {
      console.log('✅ Member atualizado com auth_user_id');
    }

    // 5. Testar login
    console.log('\n5. Testando login com novo usuário...');
    
    const testClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);
    
    const { data: finalLoginData, error: finalLoginError } = await testClient.auth.signInWithPassword({
      email: deise.email,
      password: 'senha123'
    });

    if (finalLoginError) {
      console.error('❌ Login falhou:', finalLoginError.message);
    } else {
      console.log('✅ Login funcionou!');
      console.log('   User ID:', finalLoginData.user.id);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar a verificação
checkDeiseCredentials()
  .then(() => {
    console.log('\n🏁 Verificação concluída');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });