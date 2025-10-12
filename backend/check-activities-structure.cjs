const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkActivitiesStructure() {
  console.log('=== Verificando estrutura da tabela activities ===');
  
  const { data: activities, error } = await supabase
    .from('activities')
    .select('*')
    .limit(3);
    
  if (error) {
    console.error('Erro:', error);
    return;
  }
  
  if (activities && activities.length > 0) {
    console.log('Colunas disponíveis na tabela activities:');
    Object.keys(activities[0]).forEach(key => {
      console.log(`- ${key}: ${typeof activities[0][key]}`);
    });
    
    console.log('\nPrimeiros 3 registros:');
    activities.forEach((activity, index) => {
      console.log(`\nRegistro ${index + 1}:`);
      console.log(JSON.stringify(activity, null, 2));
    });
    
    // Buscar registros que contenham "decolagem" em qualquer campo de texto
    console.log('\n=== Buscando registros relacionados ao Decolagem ===');
    
    // Tentar diferentes campos que podem conter informações sobre Decolagem
    const possibleFields = ['text', 'atividade_label', 'activity_label', 'label', 'description', 'tipo', 'categoria'];
    
    for (const field of possibleFields) {
      try {
        const { data: decolagemData, error: decolagemError } = await supabase
          .from('activities')
          .select('*')
          .ilike(field, '%decolagem%')
          .limit(3);
          
        if (!decolagemError && decolagemData && decolagemData.length > 0) {
          console.log(`\nEncontrados ${decolagemData.length} registros no campo '${field}' com 'decolagem':`);
          decolagemData.forEach((item, idx) => {
            console.log(`${idx + 1}. ${field}: ${item[field]}`);
          });
        }
      } catch (e) {
        // Campo não existe, continuar
      }
    }
  } else {
    console.log('Nenhum registro encontrado na tabela activities');
  }
}

checkActivitiesStructure().catch(console.error);