const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProgramaDisplay() {
  try {
    console.log('🔍 Investigando exibição de programas...\n');
    
    // Buscar todas as instituições
    const { data: instituicoes, error } = await supabase
      .from('instituicoes')
      .select('*')
      .order('nome');
    
    if (error) {
      console.error('❌ Erro ao buscar instituições:', error);
      return;
    }
    
    console.log(`✅ Encontradas ${instituicoes.length} instituições\n`);
    
    // Analisar estrutura de programas
    let comProgramaUnico = 0;
    let comMultiplosProgramas = 0;
    let comAmbos = 0;
    let semProgramas = 0;
    
    console.log('📊 ANÁLISE DETALHADA:\n');
    
    instituicoes.forEach((inst, index) => {
      const temPrograma = inst.programa && inst.programa.trim() !== '';
      const temProgramas = inst.programas && Array.isArray(inst.programas) && inst.programas.length > 0;
      
      console.log(`${index + 1}. ${inst.nome}`);
      console.log(`   ID: ${inst.id}`);
      console.log(`   Status: ${inst.status}`);
      
      if (temPrograma) {
        console.log(`   ✓ programa (único): "${inst.programa}"`);
        comProgramaUnico++;
      } else {
        console.log(`   ✗ programa (único): ${inst.programa || 'null/undefined'}`);
      }
      
      if (temProgramas) {
        console.log(`   ✓ programas (múltiplos): [${inst.programas.map(p => `"${p}"`).join(', ')}] (${inst.programas.length} itens)`);
        comMultiplosProgramas++;
      } else {
        console.log(`   ✗ programas (múltiplos): ${JSON.stringify(inst.programas)}`);
      }
      
      if (temPrograma && temProgramas) {
        console.log(`   ⚠️  TEM AMBOS OS CAMPOS!`);
        comAmbos++;
      }
      
      if (!temPrograma && !temProgramas) {
        console.log(`   ❌ SEM PROGRAMAS DEFINIDOS`);
        semProgramas++;
      }
      
      // Simular lógica do frontend
      let displayResult = '';
      if (temProgramas) {
        const labels = {
          as_maras: 'As Maras',
          microcredito: 'Microcrédito',
          decolagem: 'Decolagem'
        };
        displayResult = inst.programas.map(p => labels[p] || p).join(', ');
      } else if (temPrograma) {
        const labels = {
          as_maras: 'As Maras',
          microcredito: 'Microcrédito',
          decolagem: 'Decolagem'
        };
        displayResult = labels[inst.programa] || inst.programa;
      } else {
        displayResult = '-';
      }
      
      console.log(`   🎯 RESULTADO ESPERADO NA UI: "${displayResult}"`);
      console.log('');
    });
    
    console.log('📈 RESUMO ESTATÍSTICO:');
    console.log(`   • Com programa único: ${comProgramaUnico}`);
    console.log(`   • Com múltiplos programas: ${comMultiplosProgramas}`);
    console.log(`   • Com ambos os campos: ${comAmbos}`);
    console.log(`   • Sem programas: ${semProgramas}`);
    console.log(`   • Total: ${instituicoes.length}\n`);
    
    // Focar nas que deveriam mostrar múltiplos programas
    const comMultiplos = instituicoes.filter(inst => 
      inst.programas && Array.isArray(inst.programas) && inst.programas.length > 1
    );
    
    if (comMultiplos.length > 0) {
      console.log('🎯 INSTITUIÇÕES COM MÚLTIPLOS PROGRAMAS:');
      comMultiplos.forEach(inst => {
        console.log(`   • ${inst.nome}: ${inst.programas.join(', ')}`);
      });
    } else {
      console.log('⚠️  NENHUMA INSTITUIÇÃO COM MÚLTIPLOS PROGRAMAS ENCONTRADA');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugProgramaDisplay();