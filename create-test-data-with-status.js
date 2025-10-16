import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('🔧 Criando dados de teste com diferentes status...\n');

  // Dados de teste com diferentes status
  const testData = [
    // ONGs Decolagem - Ativas
    {
      nome: 'Decolagem Ativa 1',
      programa: 'decolagem',
      regional: 'sp',
      status: 'ativa',
      endereco: 'São Paulo, SP',
      telefone: '(11) 1111-1111',
      email: 'decolagem1@test.com'
    },
    {
      nome: 'Decolagem Ativa 2',
      programa: 'decolagem',
      regional: 'rj',
      status: 'ativa',
      endereco: 'Rio de Janeiro, RJ',
      telefone: '(21) 2222-2222',
      email: 'decolagem2@test.com'
    },
    // ONGs Decolagem - Inativas
    {
      nome: 'Decolagem Inativa 1',
      programa: 'decolagem',
      regional: 'mg_es',
      status: 'inativa',
      endereco: 'Belo Horizonte, MG',
      telefone: '(31) 3333-3333',
      email: 'decolagem3@test.com'
    },
    // ONGs Decolagem - Evadidas
    {
      nome: 'Decolagem Evadida 1',
      programa: 'decolagem',
      regional: 'sul',
      status: 'evadida',
      endereco: 'Porto Alegre, RS',
      telefone: '(51) 4444-4444',
      email: 'decolagem4@test.com',
      evasao_data: new Date().toISOString(),
      evasao_motivo: 'Teste de evasão'
    },
    // ONGs Maras - Ativas
    {
      nome: 'Maras Ativa 1',
      programa: 'as_maras',
      regional: 'nordeste_1',
      status: 'ativa',
      endereco: 'Salvador, BA',
      telefone: '(71) 5555-5555',
      email: 'maras1@test.com'
    },
    {
      nome: 'Maras Ativa 2',
      programa: 'as_maras',
      regional: 'nordeste_2',
      status: 'ativa',
      endereco: 'Recife, PE',
      telefone: '(81) 6666-6666',
      email: 'maras2@test.com'
    },
    // ONGs Maras - Inativas
    {
      nome: 'Maras Inativa 1',
      programa: 'as_maras',
      regional: 'centro_oeste',
      status: 'inativa',
      endereco: 'Brasília, DF',
      telefone: '(61) 7777-7777',
      email: 'maras3@test.com'
    },
    // ONGs Maras - Evadidas
    {
      nome: 'Maras Evadida 1',
      programa: 'as_maras',
      regional: 'norte',
      status: 'evadida',
      endereco: 'Manaus, AM',
      telefone: '(92) 8888-8888',
      email: 'maras4@test.com',
      evasao_data: new Date().toISOString(),
      evasao_motivo: 'Teste de evasão'
    }
  ];

  try {
    // Limpar dados existentes
    console.log('🧹 Limpando dados existentes...');
    const { error: deleteError } = await supabase
      .from('instituicoes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.log('⚠️  Aviso ao limpar dados:', deleteError.message);
    }

    // Inserir novos dados
    console.log('📊 Inserindo dados de teste...');
    const { data, error } = await supabase
      .from('instituicoes')
      .insert(testData)
      .select();

    if (error) {
      console.error('❌ Erro ao inserir dados:', error);
      return;
    }

    console.log(`✅ ${data.length} instituições inseridas com sucesso!\n`);

    // Verificar os dados inseridos
    const { data: allData, error: fetchError } = await supabase
      .from('instituicoes')
      .select('nome, programa, status')
      .order('programa', { ascending: true })
      .order('status', { ascending: true });

    if (fetchError) {
      console.error('❌ Erro ao verificar dados:', fetchError);
      return;
    }

    console.log('📈 Dados inseridos:');
    
    const decolagemAtivas = allData.filter(d => d.programa === 'decolagem' && d.status === 'ativa').length;
    const decolagemInativas = allData.filter(d => d.programa === 'decolagem' && d.status === 'inativa').length;
    const decolagemEvadidas = allData.filter(d => d.programa === 'decolagem' && d.status === 'evadida').length;
    
    const marasAtivas = allData.filter(d => d.programa === 'as_maras' && d.status === 'ativa').length;
    const marasInativas = allData.filter(d => d.programa === 'as_maras' && d.status === 'inativa').length;
    const marasEvadidas = allData.filter(d => d.programa === 'as_maras' && d.status === 'evadida').length;

    console.log('\n🎯 ONGs Decolagem:');
    console.log(`  - Ativas: ${decolagemAtivas} (devem aparecer no card)`);
    console.log(`  - Inativas: ${decolagemInativas} (NÃO devem aparecer)`);
    console.log(`  - Evadidas: ${decolagemEvadidas} (NÃO devem aparecer)`);

    console.log('\n🎯 ONGs Maras:');
    console.log(`  - Ativas: ${marasAtivas} (devem aparecer no card)`);
    console.log(`  - Inativas: ${marasInativas} (NÃO devem aparecer)`);
    console.log(`  - Evadidas: ${marasEvadidas} (NÃO devem aparecer)`);

    console.log('\n✅ Dados de teste criados com sucesso!');
    console.log('📋 Agora você pode testar se os cards mostram apenas as ONGs ativas.');

  } catch (error) {
    console.error('❌ Erro durante a criação dos dados:', error);
  }
}

createTestData();