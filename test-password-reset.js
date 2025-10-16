const { createClient } = require('@supabase/supabase-js');

async function resetUserPassword() {
  console.log('🔧 Resetando senha do usuário...');
  
  // Configuração do Supabase com service role key
  const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE';
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // ID do usuário Erika Miranda (super_admin)
    const userId = '97bd9476-91ab-4b2e-823c-521f4fdc0215';
    const newPassword = 'Admin123!';
    
    console.log('🔑 Atualizando senha do usuário...');
    
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) {
      console.error('❌ Erro ao atualizar senha:', error);
    } else {
      console.log('✅ Senha atualizada com sucesso!');
      console.log('📧 Email:', data.user.email);
      console.log('🔑 Nova senha:', newPassword);
      console.log('');
      console.log('🧪 Agora você pode testar o login com:');
      console.log(`Email: ${data.user.email}`);
      console.log(`Senha: ${newPassword}`);
    }
    
  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

resetUserPassword();