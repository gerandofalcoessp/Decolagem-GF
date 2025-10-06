const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMembersTable() {
  console.log('🔍 Verificando estrutura da tabela members...\n');
  
  try {
    // Verificar se a tabela existe e suas colunas
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('❌ Erro ao acessar tabela members:', error.message);
      return;
    }
    
    console.log('✅ Tabela members existe');
    
    // Buscar alguns registros para ver a estrutura
    const { data: samples, error: sampleError } = await supabase
      .from('members')
      .select('*')
      .limit(5);
      
    if (sampleError) {
      console.error('❌ Erro ao buscar amostras:', sampleError.message);
      return;
    }
    
    console.log('📊 Estrutura da tabela (baseada em registros existentes):');
    if (samples && samples.length > 0) {
      console.log('Colunas encontradas:', Object.keys(samples[0]));
      console.log('\n📝 Primeiros registros:');
      samples.forEach((record, index) => {
        console.log(`${index + 1}.`, JSON.stringify(record, null, 2));
      });
    } else {
      console.log('📭 Nenhum registro encontrado na tabela members');
    }
    
    // Verificar quantos registros existem
    const { count, error: countError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });
      
    if (!countError) {
      console.log(`\n📊 Total de registros na tabela members: ${count}`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

checkMembersTable().catch(console.error);