const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ixqjqhqxqhqxqhqx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHF4cWhxeHFocXgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzU1MzIwMCwiZXhwIjoyMDUzMTI5MjAwfQ.abc123';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarDadosTodasRegionais() {
  try {
    console.log('=== DADOS REAIS DE TODAS AS REGIONAIS ===\n');
    
    // Buscar todas as atividades regionais
    const { data: atividades, error } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('status', 'ativo');
    
    if (error) {
      console.error('Erro ao buscar atividades:', error);
      return;
    }
    
    console.log('Total de atividades encontradas:', atividades?.length || 0);
    
    // Agrupar por regional
    const dadosPorRegional = {};
    
    atividades?.forEach(atividade => {
      const regional = atividade.regional;
      const tipo = atividade.atividade_label;
      const quantidade = parseInt(atividade.quantidade) || 0;
      
      if (!dadosPorRegional[regional]) {
        dadosPorRegional[regional] = {};
      }
      
      if (!dadosPorRegional[regional][tipo]) {
        dadosPorRegional[regional][tipo] = 0;
      }
      
      dadosPorRegional[regional][tipo] += quantidade;
    });
    
    // Exibir dados por regional
    Object.entries(dadosPorRegional).forEach(([regional, dados]) => {
      console.log(`\n--- REGIONAL: ${regional.toUpperCase()} ---`);
      Object.entries(dados).forEach(([tipo, total]) => {
        console.log(`  ${tipo}: ${total}`);
      });
    });
    
    // Buscar dados de instituições
    console.log('\n=== DADOS DE INSTITUIÇÕES ===');
    const { data: instituicoes, error: instError } = await supabase
      .from('institution_statistics')
      .select('*');
    
    if (instError) {
      console.error('Erro ao buscar instituições:', instError);
    } else {
      console.log('Estatísticas de instituições:');
      instituicoes?.forEach(inst => {
        console.log(`  Regional: ${inst.regional}, ONGs Maras: ${inst.ongs_maras}, ONGs Decolagem: ${inst.ongs_decolagem}, Total: ${inst.total}`);
      });
    }
    
    // Buscar metas por regional
    console.log('\n=== METAS POR REGIONAL ===');
    const { data: metas, error: metasError } = await supabase
      .from('goals')
      .select('regional, regionais');
    
    if (metasError) {
      console.error('Erro ao buscar metas:', metasError);
    } else {
      const metasPorRegional = {};
      metas?.forEach(meta => {
        if (meta.regional) {
          metasPorRegional[meta.regional] = (metasPorRegional[meta.regional] || 0) + 1;
        }
        if (meta.regionais && Array.isArray(meta.regionais)) {
          meta.regionais.forEach(reg => {
            metasPorRegional[reg] = (metasPorRegional[reg] || 0) + 1;
          });
        }
      });
      
      Object.entries(metasPorRegional).forEach(([regional, count]) => {
        console.log(`  ${regional}: ${count} metas`);
      });
    }
    
  } catch (err) {
    console.error('Erro:', err);
  }
}

verificarDadosTodasRegionais();