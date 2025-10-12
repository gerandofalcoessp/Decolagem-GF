const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDiagnosticosRealizados() {
  try {
    console.log('Verificando atividades de diagnósticos realizados...');
    
    // Buscar atividades com tipo 'diagnosticos_realizados'
    const { data: atividades, error } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('atividade_label', 'Diagnósticos Realizados')
      .eq('status', 'ativo');
    
    if (error) {
      console.error('Erro ao buscar atividades:', error);
      return;
    }
    
    console.log('Total de atividades encontradas:', atividades?.length || 0);
    
    if (atividades && atividades.length > 0) {
      console.log('Atividades encontradas:');
      atividades.forEach((atividade, index) => {
        console.log(`${index + 1}. Regional: ${atividade.regional}, Quantidade: ${atividade.quantidade}, Data: ${atividade.data_atividade}`);
      });
      
      // Calcular total
      const total = atividades.reduce((sum, atividade) => {
        return sum + (parseInt(atividade.quantidade) || 0);
      }, 0);
      
      console.log('Total de diagnósticos realizados:', total);
    } else {
      console.log('Nenhuma atividade de diagnósticos realizados encontrada.');
    }
    
  } catch (err) {
    console.error('Erro:', err);
  }
}

checkDiagnosticosRealizados();