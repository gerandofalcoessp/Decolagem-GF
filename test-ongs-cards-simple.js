import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOngsCards() {
  console.log('🔍 Testando os cards ONGs Decolagem e ONGs Maras...\n');

  try {
    // Buscar todas as instituições
    const { data: allInstituicoes, error: allError } = await supabase
      .from('instituicoes')
      .select('id, nome, programa, regional, status');

    if (allError) {
      console.error('❌ Erro ao buscar instituições:', allError);
      return;
    }

    console.log(`📊 Total de instituições encontradas: ${allInstituicoes.length}\n`);

    // Analisar distribuição por status
    const statusCount = {};
    const decolagemByStatus = {};
    const marasByStatus = {};

    allInstituicoes.forEach(inst => {
      const status = inst.status || 'undefined';
      
      // Contagem geral por status
      statusCount[status] = (statusCount[status] || 0) + 1;
      
      // Contagem específica por programa
      if (inst.programa === 'decolagem') {
        decolagemByStatus[status] = (decolagemByStatus[status] || 0) + 1;
      }
      if (inst.programa === 'as_maras') {
        marasByStatus[status] = (marasByStatus[status] || 0) + 1;
      }
    });

    console.log('📈 Distribuição por status:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    console.log('\n🎯 ONGs Decolagem por status:');
    Object.entries(decolagemByStatus).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    console.log('\n🎯 ONGs Maras por status:');
    Object.entries(marasByStatus).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    // Simular o que o endpoint /stats deveria retornar (apenas ativas)
    const { data: activeDecolagem, error: decolagemError } = await supabase
      .from('instituicoes')
      .select('id')
      .eq('programa', 'decolagem')
      .eq('status', 'ativa');

    const { data: activeMaras, error: marasError } = await supabase
      .from('instituicoes')
      .select('id')
      .eq('programa', 'as_maras')
      .eq('status', 'ativa');

    if (decolagemError || marasError) {
      console.error('❌ Erro ao buscar instituições ativas:', decolagemError || marasError);
      return;
    }

    console.log('\n✅ Resultado esperado nos cards (apenas ativas):');
    console.log(`  - ONGs Decolagem: ${activeDecolagem.length}`);
    console.log(`  - ONGs Maras: ${activeMaras.length}`);

    // Verificar se há instituições inativas ou evadidas que não deveriam aparecer
    const inactiveDecolagem = allInstituicoes.filter(inst => 
      inst.programa === 'decolagem' && inst.status !== 'ativa'
    ).length;

    const inactiveMaras = allInstituicoes.filter(inst => 
      inst.programa === 'as_maras' && inst.status !== 'ativa'
    ).length;

    if (inactiveDecolagem > 0 || inactiveMaras > 0) {
      console.log('\n⚠️  Instituições que NÃO devem aparecer nos cards:');
      console.log(`  - ONGs Decolagem inativas/evadidas: ${inactiveDecolagem}`);
      console.log(`  - ONGs Maras inativas/evadidas: ${inactiveMaras}`);
    } else {
      console.log('\n✅ Todas as instituições têm status "ativa" - cards estão corretos!');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testOngsCards();