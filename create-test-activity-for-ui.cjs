const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestActivity() {
  console.log('🧪 Criando atividade de teste para exclusão via UI...\n');

  try {
    // 1. Fazer login como Deise
    console.log('1️⃣ Fazendo login como Deise...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'coord.regional.co@gerandofalcoes.com',
      password: 'senha123'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }

    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário:', authData.user.email);

    // 2. Criar atividade de teste
    console.log('\n2️⃣ Criando atividade de teste...');
    const testActivity = {
      title: 'TESTE - Atividade para Exclusão UI',
      description: 'Esta é uma atividade criada especificamente para testar a exclusão através da interface do usuário.',
      regional: 'centro_oeste',
      member_id: '70357d45-7cac-4c12-83e8-778fa4ab913a', // ID correto da Deise na tabela members
      activity_date: new Date().toISOString().split('T')[0],
      status: 'ativo',
      programa: 'Decolagem',
      quantidade: 50,
      atividade_label: 'Atendidos Diretos',
      estados: ['GO', 'MT', 'MS', 'DF']
    };

    const { data: newActivity, error: createError } = await supabase
      .from('regional_activities')
      .insert(testActivity)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar atividade:', createError.message);
      return;
    }

    console.log('✅ Atividade criada com sucesso!');
    console.log('📋 Detalhes da atividade:');
    console.log('   - ID:', newActivity.id);
    console.log('   - Título:', newActivity.title);
    console.log('   - Regional:', newActivity.regional);
    console.log('   - Data:', newActivity.activity_date);
    console.log('   - Status:', newActivity.status);

    console.log('\n🎯 Agora você pode:');
    console.log('1. Acessar o frontend em http://localhost:3000');
    console.log('2. Fazer login como coord.regional.co@gerandofalcoes.com / senha123');
    console.log('3. Ir para Regionais > Gestão de Atividades');
    console.log('4. Tentar excluir a atividade "TESTE - Atividade para Exclusão UI"');
    console.log('5. Verificar os logs do console do navegador durante o processo');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createTestActivity();