const { createClient } = require('@supabase/supabase-js');

async function checkExistingUsers() {
  console.log('🔍 Verificando usuários existentes...');
  
  // Configuração do Supabase com service role key
  const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE';
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('📋 Verificando usuários no Supabase Auth...');
    
    // Listar usuários do Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erro ao listar usuários do Auth:', authError);
    } else {
      console.log(`✅ Encontrados ${authUsers.users.length} usuários no Auth:`);
      authUsers.users.forEach(user => {
        console.log(`- ${user.email} (ID: ${user.id})`);
        console.log(`  Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
        console.log(`  Metadata: ${JSON.stringify(user.user_metadata)}`);
        console.log('');
      });
    }
    
    console.log('📋 Verificando usuários na tabela usuarios...');
    
    // Listar usuários da tabela usuarios
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(10);

    if (usuariosError) {
      console.error('❌ Erro ao listar usuários da tabela usuarios:', usuariosError);
    } else {
      console.log(`✅ Encontrados ${usuarios.length} usuários na tabela usuarios:`);
      usuarios.forEach(usuario => {
        console.log(`- ${usuario.nome} (${usuario.email})`);
        console.log(`  Role: ${usuario.role} | Status: ${usuario.status}`);
        console.log(`  Auth ID: ${usuario.auth_user_id}`);
        console.log('');
      });
    }
    
    // Se não há usuários, vamos tentar criar um simples
    if (authUsers && authUsers.users.length === 0) {
      console.log('🔧 Nenhum usuário encontrado. Tentando criar um usuário simples...');
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@test.com',
        password: 'Admin123!',
        email_confirm: true
      });

      if (createError) {
        console.error('❌ Erro ao criar usuário simples:', createError);
      } else {
        console.log('✅ Usuário simples criado:', newUser.user.email);
        
        // Criar entrada na tabela usuarios
        const { error: usuarioError } = await supabase
          .from('usuarios')
          .insert([
            {
              auth_user_id: newUser.user.id,
              email: 'admin@test.com',
              nome: 'Admin Test',
              role: 'admin',
              status: 'ativo'
            }
          ]);

        if (usuarioError) {
          console.error('❌ Erro ao criar entrada na tabela usuarios:', usuarioError);
        } else {
          console.log('✅ Entrada criada na tabela usuarios');
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

checkExistingUsers();