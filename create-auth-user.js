const { createClient } = require('@supabase/supabase-js');

async function createAuthUser() {
  console.log('🔧 Criando usuário completo no Supabase Auth...');
  
  // Configuração do Supabase com service role key
  const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE';
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('📝 Criando usuário no Supabase Auth...');
    
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'superadmin@decolagem.com',
      password: 'SuperAdmin2024!',
      email_confirm: true,
      user_metadata: {
        nome: 'Super Admin',
        role: 'super_admin'
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError);
      return;
    }

    console.log('✅ Usuário criado no Auth:', authData.user.id);
    
    // Criar entrada na tabela usuarios
    console.log('📝 Criando entrada na tabela usuarios...');
    
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios')
      .insert([
        {
          auth_user_id: authData.user.id,
          email: 'superadmin@decolagem.com',
          nome: 'Super Admin',
          role: 'super_admin',
          status: 'ativo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (usuarioError) {
      console.error('❌ Erro ao criar entrada na tabela usuarios:', usuarioError);
      return;
    }

    console.log('✅ Entrada criada na tabela usuarios:', usuarioData);
    
    // Verificar se o usuário foi criado corretamente
    const { data: users, error: selectError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'superadmin@decolagem.com');
      
    if (selectError) {
      console.error('❌ Erro ao verificar usuário:', selectError);
      return;
    }
    
    console.log('🔍 Usuário verificado:', users);
    console.log('🎉 Usuário completo criado com sucesso!');
    
  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

createAuthUser();