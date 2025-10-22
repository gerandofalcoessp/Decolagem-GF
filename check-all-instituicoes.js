const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAllInstituicoes() {
  try {
    console.log('🔍 Verificando todas as instituições...\n');
    
    // Contar total de registros
    const { count, error: countError } = await supabase
      .from('instituicoes')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
      return;
    }
    
    console.log(`📊 Total de registros na tabela: ${count}`);
    
    if (count === 0) {
      console.log('\n⚠️  A tabela instituicoes está vazia!');
      console.log('💡 Isso explica por que não conseguimos salvar - a coluna existe, mas não há dados para testar.');
      return;
    }
    
    // Se há registros, buscar todos
    const { data: instituicoes, error } = await supabase
      .from('instituicoes')
      .select('*');
    
    if (error) {
      console.error('❌ Erro ao buscar instituições:', error);
      return;
    }
    
    console.log('\n📋 Todas as instituições:');
    instituicoes.forEach((inst, index) => {
      console.log(`\n${index + 1}. ID: ${inst.id}`);
      console.log(`   Nome: ${inst.nome}`);
      console.log(`   Programa: ${inst.programa}`);
      console.log(`   Programas: ${JSON.stringify(inst.programas)}`);
      console.log(`   Estado: ${inst.estado}`);
      console.log(`   Cidade: ${inst.cidade}`);
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkAllInstituicoes();