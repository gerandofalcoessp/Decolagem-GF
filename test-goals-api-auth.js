const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';

async function testGoalsApiWithAuth() {
  console.log('🔍 Testando API de metas com autenticação...\n');

  try {
    // 1. Fazer login com o usuário de teste
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'teste@decolagem.com',
      password: 'teste123'
    });

    if (authError) {
      console.error('❌ Erro ao fazer login:', authError.message);
      return;
    }

    console.log('✅ Login realizado com sucesso');
    console.log('Token:', authData.session?.access_token?.substring(0, 50) + '...');

    // 2. Testar a API de metas com o token usando fetch nativo
    const response = await fetch('http://localhost:4000/goals', {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Erro na API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Resposta:', errorText);
      return;
    }

    const data = await response.json();
    console.log('\n✅ API respondeu com sucesso');
    console.log('Número de metas:', data.data?.length || 0);

    if (data.data && data.data.length > 0) {
      console.log('\n📋 Primeira meta:');
      const firstGoal = data.data[0];
      console.log('  ID:', firstGoal.id);
      console.log('  Nome:', firstGoal.nome || 'N/A');
      console.log('  Descrição:', firstGoal.descricao || 'N/A');
      console.log('  Valor Meta:', firstGoal.valor_meta || 'N/A');
      console.log('  Valor Atual:', firstGoal.valor_atual || 'N/A');
      console.log('  Status:', firstGoal.status || 'N/A');
      console.log('  Member ID:', firstGoal.member_id || 'N/A');
      console.log('  Criado em:', firstGoal.created_at || 'N/A');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testGoalsApiWithAuth();