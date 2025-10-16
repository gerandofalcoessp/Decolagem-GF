// Script para testar diretamente no Supabase se existe um usuário válido
const { createClient } = require('@supabase/supabase-js');

async function testDirectSupabase() {
  console.log('🔍 Testando usuários existentes no Supabase...\n');

  // Configuração do Supabase (usando as mesmas variáveis do backend)
  const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar se existem usuários na tabela usuarios (não users)
    console.log('📋 Verificando usuários existentes...');
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('id, email, nome, role')
      .limit(5);
    
    if (error) {
      console.log('❌ Erro ao buscar usuários:', error.message);
      return;
    }
    
    if (users && users.length > 0) {
      console.log('✅ Usuários encontrados:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}, Nome: ${user.nome}, Role: ${user.role}`);
      });
    } else {
      console.log('⚠️ Nenhum usuário encontrado na tabela users');
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

testDirectSupabase();