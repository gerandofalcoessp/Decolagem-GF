const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugApiQuery() {
  console.log('🔍 Debugando a query exata usada pela API...\n');

  try {
    // Replicar exatamente a query da API
    console.log('1. 📊 Executando query da API...');
    const { data: instituicoesData, error } = await supabase
      .from('instituicoes')
      .select('id, nome, status, programa, programas, regional')
      .in('status', ['ativa', 'evadida']);

    if (error) {
      console.error('❌ Erro na query:', error);
      return;
    }

    console.log(`📋 Total de instituições retornadas: ${instituicoesData.length}\n`);

    // Replicar exatamente a lógica de processamento da API
    console.log('2. 🔄 Processando dados com a lógica da API...');
    
    let totalInstituicoes = 0;
    const programCounts = {};
    const programEvasaoCounts = {};

    for (const instituicao of instituicoesData) {
      totalInstituicoes++;
      
      console.log(`\n📋 Processando instituição ${instituicao.id}:`);
      console.log(`   Nome: ${instituicao.nome || 'Sem nome'}`);
      console.log(`   Status: ${instituicao.status}`);
      console.log(`   Programa (singular): ${instituicao.programa}`);
      console.log(`   Programas (array): ${JSON.stringify(instituicao.programas)}`);
      
      // Usar o campo 'programas' array se disponível, senão usar 'programa' único para compatibilidade
      const programasArray = instituicao.programas && Array.isArray(instituicao.programas) && instituicao.programas.length > 0 
        ? instituicao.programas 
        : (instituicao.programa ? [instituicao.programa] : []);
      
      console.log(`   Programas processados: ${JSON.stringify(programasArray)}`);
      
      // Contabilizar cada programa separadamente (permite contabilização múltipla)
      for (const programa of programasArray) {
        console.log(`   Contabilizando programa: "${programa}" para status "${instituicao.status}"`);
        
        if (instituicao.status === 'ativa') {
          programCounts[programa] = (programCounts[programa] || 0) + 1;
          console.log(`     programCounts["${programa}"] = ${programCounts[programa]}`);
        } else if (instituicao.status === 'evadida') {
          programEvasaoCounts[programa] = (programEvasaoCounts[programa] || 0) + 1;
          console.log(`     programEvasaoCounts["${programa}"] = ${programEvasaoCounts[programa]}`);
        }
      }
    }

    console.log('\n3. 📊 Contadores finais:');
    console.log('   programCounts:', programCounts);
    console.log('   programEvasaoCounts:', programEvasaoCounts);

    // Aplicar a lógica de contagem final da API
    const ongsMaras = (programCounts['maras'] || 0) + (programCounts['as_maras'] || 0);
    const ongsDecolagem = programCounts['decolagem'] || 0;

    console.log('\n4. 🎯 Resultado final da API:');
    console.log(`   ONGs Maras: ${ongsMaras}`);
    console.log(`   ONGs Decolagem: ${ongsDecolagem}`);

    // Verificar se há algum problema com filtros
    console.log('\n5. 🔍 Verificando possíveis problemas:');
    
    const ativasDecolagem = instituicoesData.filter(inst => 
      inst.status === 'ativa' && 
      ((inst.programas && inst.programas.includes('decolagem')) || inst.programa === 'decolagem')
    );
    
    console.log(`   Instituições ativas com programa "decolagem": ${ativasDecolagem.length}`);
    ativasDecolagem.forEach((inst, index) => {
      console.log(`     ${index + 1}. ${inst.nome || 'Sem nome'} (ID: ${inst.id})`);
    });

  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  }
}

debugApiQuery();