require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLigasMaras() {
  try {
    console.log('Verificando atividades relacionadas a Ligas Maras...');
    
    // Buscar atividades que contenham 'Liga' ou 'Maras' no label
    const { data: atividades, error } = await supabase
      .from('regional_activities')
      .select('*')
      .or('atividade_label.ilike.%Liga%,atividade_label.ilike.%Maras%')
      .eq('status', 'ativo');
    
    if (error) {
      console.error('Erro ao buscar atividades:', error);
      return;
    }
    
    console.log('Total de atividades encontradas:', atividades?.length || 0);
    
    if (atividades && atividades.length > 0) {
      console.log('Atividades encontradas:');
      atividades.forEach((atividade, index) => {
        console.log(`${index + 1}. Label: ${atividade.atividade_label}, Regional: ${atividade.regional}, Quantidade: ${atividade.quantidade}`);
      });
      
      // Calcular total
      const total = atividades.reduce((sum, atividade) => {
        return sum + (parseInt(atividade.quantidade) || 0);
      }, 0);
      
      console.log('Total de Ligas Maras:', total);
    } else {
      console.log('Nenhuma atividade relacionada a Ligas Maras encontrada.');
      
      // Vamos verificar todas as atividades disponíveis
      console.log('\nVerificando todas as atividades disponíveis...');
      const { data: todasAtividades, error: errorTodas } = await supabase
        .from('regional_activities')
        .select('atividade_label')
        .eq('status', 'ativo');
      
      if (!errorTodas && todasAtividades) {
        const labelsUnicos = [...new Set(todasAtividades.map(a => a.atividade_label))];
        console.log('Labels únicos encontrados:');
        labelsUnicos.forEach((label, index) => {
          console.log(`${index + 1}. ${label}`);
        });
      }
    }
    
  } catch (err) {
    console.error('Erro:', err);
  }
}

checkLigasMaras();