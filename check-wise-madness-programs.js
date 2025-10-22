const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWiseMadnessPrograms() {
  try {
    console.log('🔍 Buscando Associação Wise Madness no banco de dados...\n');
    
    // Buscar a instituição Wise Madness
    const { data: instituicoes, error } = await supabase
      .from('instituicoes')
      .select('*')
      .ilike('nome', '%wise madness%');
    
    if (error) {
      console.error('❌ Erro ao buscar instituição:', error);
      return;
    }
    
    if (!instituicoes || instituicoes.length === 0) {
      console.log('❌ Associação Wise Madness não encontrada no banco de dados');
      return;
    }
    
    console.log(`✅ Encontrada(s) ${instituicoes.length} instituição(ões):\n`);
    
    instituicoes.forEach((inst, index) => {
      console.log(`--- Instituição ${index + 1} ---`);
      console.log('ID:', inst.id);
      console.log('Nome:', inst.nome);
      console.log('CNPJ:', inst.cnpj || 'N/A');
      console.log('Status:', inst.status);
      console.log('Regional:', inst.regional);
      console.log('Cidade:', inst.cidade || 'N/A');
      
      // Verificar programa único
      if (inst.programa) {
        console.log('Programa (único):', inst.programa);
      }
      
      // Verificar múltiplos programas
      if (inst.programas) {
        console.log('Programas (múltiplos):', inst.programas);
        console.log('Quantidade de programas:', inst.programas.length);
      }
      
      // Verificar se tem ambos os campos
      if (inst.programa && inst.programas) {
        console.log('⚠️  ATENÇÃO: Esta instituição tem tanto "programa" quanto "programas"');
      }
      
      if (!inst.programa && !inst.programas) {
        console.log('⚠️  ATENÇÃO: Esta instituição não tem programas definidos');
      }
      
      console.log('Created at:', inst.created_at);
      console.log('Updated at:', inst.updated_at);
      console.log('---\n');
    });
    
    // Verificar se alguma tem múltiplos programas
    const comMultiplosProgramas = instituicoes.filter(inst => 
      inst.programas && inst.programas.length > 1
    );
    
    if (comMultiplosProgramas.length > 0) {
      console.log('✅ Instituições com múltiplos programas encontradas:');
      comMultiplosProgramas.forEach(inst => {
        console.log(`- ${inst.nome}: ${inst.programas.join(', ')}`);
      });
    } else {
      console.log('ℹ️  Nenhuma instituição Wise Madness com múltiplos programas encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkWiseMadnessPrograms();