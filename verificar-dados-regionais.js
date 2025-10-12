const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://ixqjqhqxqhqxqhqx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHF4cWhxeHFocXgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzU1MzIwMCwiZXhwIjoyMDUzMTI5MjAwfQ.abc123';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarDadosReaisPorRegional() {
  try {
    console.log('=== VERIFICAÇÃO DE DADOS REAIS POR REGIONAL ===\n');
    
    // 1. METAS POR REGIONAL
    console.log('1. METAS POR REGIONAL:');
    const { data: metas, error: metasError } = await supabase
      .from('goals')
      .select('*');
    
    if (metasError) {
      console.error('Erro ao buscar metas:', metasError);
    } else {
      const metasPorRegional = {};
      const metasConcluidasPorRegional = {};
      
      metas?.forEach(meta => {
        const regional = meta.regional || 'Sem Regional';
        
        // Total de metas
        if (!metasPorRegional[regional]) {
          metasPorRegional[regional] = 0;
        }
        metasPorRegional[regional]++;
        
        // Metas concluídas
        if (!metasConcluidasPorRegional[regional]) {
          metasConcluidasPorRegional[regional] = 0;
        }
        if (meta.status === 'concluida') {
          metasConcluidasPorRegional[regional]++;
        }
      });
      
      console.log('Total de metas por regional:');
      Object.entries(metasPorRegional).forEach(([regional, count]) => {
        const concluidas = metasConcluidasPorRegional[regional] || 0;
        console.log(`  - ${regional}: ${count} metas (${concluidas} concluídas)`);
      });
      
      console.log(`\nTotal geral: ${metas?.length || 0} metas`);
    }
    
    // 2. ATIVIDADES REGIONAIS
    console.log('\n2. ATIVIDADES REGIONAIS:');
    const { data: atividades, error: atividadesError } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('status', 'ativo');
    
    if (atividadesError) {
      console.error('Erro ao buscar atividades:', atividadesError);
    } else {
      const atividadesPorRegional = {};
      const resumoPorTipo = {};
      
      atividades?.forEach(atividade => {
        const regional = atividade.regional || 'Sem Regional';
        const tipo = atividade.atividade_label || 'Outros';
        const quantidade = parseInt(atividade.quantidade) || 0;
        
        // Por regional
        if (!atividadesPorRegional[regional]) {
          atividadesPorRegional[regional] = {};
        }
        if (!atividadesPorRegional[regional][tipo]) {
          atividadesPorRegional[regional][tipo] = 0;
        }
        atividadesPorRegional[regional][tipo] += quantidade;
        
        // Resumo por tipo
        if (!resumoPorTipo[tipo]) {
          resumoPorTipo[tipo] = 0;
        }
        resumoPorTipo[tipo] += quantidade;
      });
      
      console.log('Atividades por regional:');
      Object.entries(atividadesPorRegional).forEach(([regional, tipos]) => {
        console.log(`\n  ${regional}:`);
        Object.entries(tipos).forEach(([tipo, quantidade]) => {
          console.log(`    - ${tipo}: ${quantidade}`);
        });
      });
      
      console.log('\nResumo geral por tipo:');
      Object.entries(resumoPorTipo).forEach(([tipo, quantidade]) => {
        console.log(`  - ${tipo}: ${quantidade}`);
      });
    }
    
    // 3. ESTATÍSTICAS DE INSTITUIÇÕES (via endpoint)
    console.log('\n3. ESTATÍSTICAS DE INSTITUIÇÕES (via API):');
    try {
      const response = await fetch('http://localhost:3000/api/instituicoes/stats');
      if (response.ok) {
        const statsData = await response.json();
        console.log('Estatísticas gerais de instituições:');
        console.log(JSON.stringify(statsData, null, 2));
      } else {
        console.error('Erro ao buscar estatísticas via API:', response.status);
      }
    } catch (fetchError) {
      console.error('Erro de conexão com API:', fetchError.message);
    }
    
    // 4. DADOS ESPECÍFICOS DA REGIONAL SP
    console.log('\n4. DADOS ESPECÍFICOS DA REGIONAL SP:');
    
    // Metas SP
    const metasSP = metas?.filter(meta => meta.regional === 'SP') || [];
    const metasConcluidasSP = metasSP.filter(meta => meta.status === 'concluida');
    console.log(`SP - Metas: ${metasSP.length} total, ${metasConcluidasSP.length} concluídas`);
    
    // Atividades SP
    const atividadesSP = atividades?.filter(atividade => atividade.regional === 'SP') || [];
    const resumoSP = {};
    atividadesSP.forEach(atividade => {
      const tipo = atividade.atividade_label || 'Outros';
      const quantidade = parseInt(atividade.quantidade) || 0;
      if (!resumoSP[tipo]) {
        resumoSP[tipo] = 0;
      }
      resumoSP[tipo] += quantidade;
    });
    
    console.log('SP - Atividades:');
    Object.entries(resumoSP).forEach(([tipo, quantidade]) => {
      console.log(`  - ${tipo}: ${quantidade}`);
    });
    
  } catch (err) {
    console.error('Erro:', err);
  }
}

// Executar a verificação
verificarDadosReaisPorRegional();