const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkProgramasColumn() {
  try {
    console.log('🔍 Verificando estado da coluna programas...\n');
    
    // Verificar estrutura da tabela
    const { data: tableInfo, error: tableError } = await supabase
      .from('instituicoes')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erro ao acessar tabela:', tableError);
      return;
    }
    
    console.log('✅ Tabela instituicoes acessível');
    
    // Verificar algumas instituições para ver o estado dos dados
    const { data: instituicoes, error } = await supabase
      .from('instituicoes')
      .select('id, nome, programa, programas')
      .limit(10);
    
    if (error) {
      console.error('❌ Erro ao buscar instituições:', error);
      return;
    }
    
    console.log('\n📊 Estado atual dos dados:');
    console.log('Total de instituições verificadas:', instituicoes.length);
    
    let comProgramas = 0;
    let semProgramas = 0;
    let comProgramaUnico = 0;
    
    instituicoes.forEach((inst, index) => {
      console.log(`\n${index + 1}. ${inst.nome}:`);
      console.log(`   - programa: ${inst.programa}`);
      console.log(`   - programas: ${JSON.stringify(inst.programas)}`);
      
      if (inst.programas && inst.programas.length > 0) {
        comProgramas++;
      } else {
        semProgramas++;
      }
      
      if (inst.programa) {
        comProgramaUnico++;
      }
    });
    
    console.log('\n📈 Resumo:');
    console.log(`- Instituições com campo 'programas' preenchido: ${comProgramas}`);
    console.log(`- Instituições sem campo 'programas': ${semProgramas}`);
    console.log(`- Instituições com campo 'programa' único: ${comProgramaUnico}`);
    
    // Verificar se precisamos migrar dados
    if (semProgramas > 0 && comProgramaUnico > 0) {
      console.log('\n⚠️  AÇÃO NECESSÁRIA: Alguns dados precisam ser migrados do campo "programa" para "programas"');
    } else if (comProgramas > 0) {
      console.log('\n✅ DADOS OK: A coluna programas já está sendo utilizada!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkProgramasColumn();