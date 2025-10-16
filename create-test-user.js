const { createClient } = require('@supabase/supabase-js');

async function createTestUser() {
  console.log('🔧 Criando usuário de teste...');
  
  // Configuração do Supabase com service role key para contornar RLS
  const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE';
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Usar uma senha simples sem hash por enquanto para teste
    const password = 'SuperAdmin2024!';
    
    console.log('📝 Inserindo usuário na tabela usuarios...');
    
    // Inserir usuário diretamente na tabela usuarios
    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        {
          auth_user_id: '00000000-0000-0000-0000-000000000000', // UUID temporário
          email: 'superadmin@decolagem.com',
          nome: 'Super Admin',
          role: 'super_admin',
          status: 'ativo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('❌ Erro ao inserir usuário:', error);
      return;
    }

    console.log('✅ Usuário criado com sucesso:', data);
    
    // Verificar se o usuário foi criado
    const { data: users, error: selectError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'superadmin@decolagem.com');
      
    if (selectError) {
      console.error('❌ Erro ao verificar usuário:', selectError);
      return;
    }
    
    console.log('🔍 Usuário verificado:', users);
    
  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

createTestUser();