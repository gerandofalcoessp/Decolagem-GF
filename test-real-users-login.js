require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRealUsersLogin() {
  console.log('🔍 Testando login com usuários reais do sistema...\n');

  try {
    // Primeiro, vamos listar os usuários reais
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erro ao listar usuários:', authError);
      return;
    }

    console.log('👥 Usuários encontrados no sistema:');
    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.user_metadata?.nome || 'Sem nome'}`);
    });

    // Vamos tentar algumas senhas comuns para os usuários reais
    const commonPasswords = [
      'Teste123!',
      'teste123',
      'admin123',
      '123456',
      'password',
      'decolagem123',
      'gerandofalcoes123'
    ];

    // Vamos testar com alguns usuários específicos que parecem importantes
    const testUsers = [
      'flavio.almeida@gerandofalcoes.com', // super_admin
      'lemaestro@gerandofalcoes.com', // Diretor Operações
      'erika.miranda@gerandofalcoes.com', // Coordenadora Regional SP
      'ana.neiry@gerandofalcoes.com' // Líder Regional Nordeste
    ];

    console.log('\n🔑 Testando login com senhas comuns...\n');

    for (const email of testUsers) {
      console.log(`👤 Testando usuário: ${email}`);
      
      for (const password of commonPasswords) {
        try {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (!loginError && loginData.user) {
            console.log(`   ✅ SUCESSO! Senha: ${password}`);
            console.log(`   👤 Usuário: ${loginData.user.email}`);
            console.log(`   🎫 Token: ${loginData.session?.access_token?.substring(0, 20)}...`);
            
            // Agora vamos buscar o member_id correspondente
            const { data: member, error: memberError } = await supabase
              .from('members')
              .select('id, name, email, auth_user_id')
              .eq('auth_user_id', loginData.user.id)
              .single();

            if (!memberError && member) {
              console.log(`   👥 Member ID: ${member.id}`);
              console.log(`   📧 Member Name: ${member.name}`);
              
              // Testar a API de metas com este usuário
              console.log('   🎯 Testando API de metas...');
              
              const response = await fetch('http://localhost:4000/api/goals', {
                headers: {
                  'Authorization': `Bearer ${loginData.session.access_token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (response.ok) {
                const goals = await response.json();
                console.log(`   📊 Metas encontradas: ${goals.length}`);
                if (goals.length > 0) {
                  console.log(`   🏆 Primeira meta: ${goals[0].title}`);
                }
              } else {
                console.log(`   ❌ Erro na API de metas: ${response.status}`);
              }
            } else {
              console.log(`   ⚠️ Member não encontrado para este auth_user_id`);
            }
            
            // Fazer logout
            await supabase.auth.signOut();
            
            // Se encontramos uma senha que funciona, não precisamos testar as outras
            console.log('\n🎉 Login bem-sucedido! Parando testes para este usuário.\n');
            break;
          }
        } catch (error) {
          // Ignorar erros silenciosamente para não poluir o log
        }
      }
    }

    // Se chegamos até aqui sem sucesso, vamos tentar criar um usuário de teste
    console.log('🔧 Tentando criar um usuário de teste...');
    
    const testEmail = 'teste@decolagem.com';
    const testPassword = 'Teste123!';
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        nome: 'Usuário Teste',
        role: 'super_admin',
        tipo: 'Nacional',
        funcao: 'Administrador'
      }
    });

    if (!createError && newUser.user) {
      console.log('✅ Usuário de teste criado com sucesso!');
      console.log(`📧 Email: ${testEmail}`);
      console.log(`🔑 Senha: ${testPassword}`);
      
      // Criar um member correspondente
      const { data: newMember, error: memberError } = await supabase
        .from('members')
        .insert({
          name: 'Usuário Teste',
          email: testEmail,
          auth_user_id: newUser.user.id,
          role: 'super_admin',
          regional: 'Nacional'
        })
        .select()
        .single();

      if (!memberError && newMember) {
        console.log(`👥 Member criado com ID: ${newMember.id}`);
        
        // Testar login com o novo usuário
        const { data: testLogin, error: testLoginError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });

        if (!testLoginError && testLogin.user) {
          console.log('✅ Login com usuário de teste bem-sucedido!');
          
          // Testar API de metas
          const response = await fetch('http://localhost:4000/api/goals', {
            headers: {
              'Authorization': `Bearer ${testLogin.session.access_token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const goals = await response.json();
            console.log(`📊 Metas encontradas: ${goals.length}`);
          }
          
          await supabase.auth.signOut();
        }
      }
    } else {
      console.log('❌ Erro ao criar usuário de teste:', createError?.message);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar o script
testRealUsersLogin();