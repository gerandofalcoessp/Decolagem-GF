const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugInstituicoesData() {
  console.log('🔍 Analisando dados das instituições para debug...\n');
  
  try {
    // 1. Buscar todas as instituições
    const { data: instituicoes, error } = await supabase
      .from('instituicoes')
      .select('*')
      .in('status', ['ativa', 'evadida']);

    if (error) {
      console.error('❌ Erro ao buscar instituições:', error.message);
      return;
    }

    console.log(`📊 Total de instituições (ativa/evadida): ${instituicoes.length}\n`);

    // 2. Analisar estrutura dos dados
    console.log('📋 Analisando estrutura dos dados...');
    
    const amostra = instituicoes.slice(0, 5);
    amostra.forEach((inst, index) => {
      console.log(`\n${index + 1}. ${inst.nome_fantasia || inst.razao_social || 'Sem nome'}`);
      console.log(`   ID: ${inst.id}`);
      console.log(`   Status: ${inst.status}`);
      console.log(`   Programa (singular): ${inst.programa || 'null'}`);
      console.log(`   Programas (array): ${inst.programas ? JSON.stringify(inst.programas) : 'null'}`);
      console.log(`   Tipo programas: ${typeof inst.programas}`);
      console.log(`   É array: ${Array.isArray(inst.programas)}`);
    });

    // 3. Contar por diferentes critérios
    console.log('\n🧮 Contagem por diferentes critérios:');
    
    // Contagem usando apenas campo programa (lógica antiga)
    let marasAntigo = 0;
    let decolagemAntigo = 0;
    
    instituicoes.forEach(inst => {
      if (inst.status === 'ativa' || inst.status === 'evadida') {
        if (inst.programa === 'maras') marasAntigo++;
        if (inst.programa === 'decolagem') decolagemAntigo++;
      }
    });
    
    console.log(`\n📊 Contagem usando campo 'programa' (lógica antiga):`);
    console.log(`   Maras: ${marasAntigo}`);
    console.log(`   Decolagem: ${decolagemAntigo}`);

    // Contagem usando array programas (lógica nova)
    let marasNovo = 0;
    let decolagemNovo = 0;
    
    instituicoes.forEach(inst => {
      if (inst.status === 'ativa' || inst.status === 'evadida') {
        const programas = inst.programas && Array.isArray(inst.programas) && inst.programas.length > 0 
          ? inst.programas 
          : (inst.programa ? [inst.programa] : []);

        programas.forEach(programa => {
          if (programa === 'maras') marasNovo++;
          if (programa === 'decolagem') decolagemNovo++;
        });
      }
    });
    
    console.log(`\n📊 Contagem usando array 'programas' (lógica nova):`);
    console.log(`   Maras: ${marasNovo}`);
    console.log(`   Decolagem: ${decolagemNovo}`);

    // 4. Analisar valores únicos nos campos programa
    console.log('\n🔍 Valores únicos encontrados:');
    
    const programasUnicos = new Set();
    const programasArrayUnicos = new Set();
    
    instituicoes.forEach(inst => {
      if (inst.programa) programasUnicos.add(inst.programa);
      if (inst.programas && Array.isArray(inst.programas)) {
        inst.programas.forEach(p => programasArrayUnicos.add(p));
      }
    });
    
    console.log(`   Campo 'programa': [${Array.from(programasUnicos).join(', ')}]`);
    console.log(`   Campo 'programas': [${Array.from(programasArrayUnicos).join(', ')}]`);

    // 5. Mostrar instituições com programa 'decolagem'
    console.log('\n📋 Instituições com programa "decolagem":');
    
    const instituicoesDecolagem = instituicoes.filter(inst => {
      if (inst.status !== 'ativa' && inst.status !== 'evadida') return false;
      
      const programas = inst.programas && Array.isArray(inst.programas) && inst.programas.length > 0 
        ? inst.programas 
        : (inst.programa ? [inst.programa] : []);
      
      return programas.includes('decolagem');
    });
    
    instituicoesDecolagem.forEach((inst, index) => {
      console.log(`   ${index + 1}. ${inst.nome_fantasia || inst.razao_social || 'Sem nome'}`);
      console.log(`      Status: ${inst.status}`);
      console.log(`      Programa: ${inst.programa || 'null'}`);
      console.log(`      Programas: ${inst.programas ? JSON.stringify(inst.programas) : 'null'}`);
    });

    // 6. Verificar se há problemas de encoding ou caracteres especiais
    console.log('\n🔍 Verificando possíveis problemas de encoding...');
    
    const problemasEncoding = instituicoes.filter(inst => {
      const programa = inst.programa;
      const programas = inst.programas;
      
      if (programa && typeof programa === 'string' && programa.includes('decolagem')) {
        const bytes = Buffer.from(programa, 'utf8');
        if (bytes.length !== programa.length) {
          return true;
        }
      }
      
      if (programas && Array.isArray(programas)) {
        return programas.some(p => {
          if (typeof p === 'string' && p.includes('decolagem')) {
            const bytes = Buffer.from(p, 'utf8');
            return bytes.length !== p.length;
          }
          return false;
        });
      }
      
      return false;
    });
    
    if (problemasEncoding.length > 0) {
      console.log(`   ⚠️ Encontrados ${problemasEncoding.length} registros com possíveis problemas de encoding`);
    } else {
      console.log(`   ✅ Nenhum problema de encoding detectado`);
    }

  } catch (error) {
    console.error('❌ Erro durante análise:', error.message);
  }
}

debugInstituicoesData();