const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://ixqjqhqxqhqxqhqx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHF4cWhxeHFocXgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzU1MzIwMCwiZXhwIjoyMDUzMTI5MjAwfQ.abc123';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarAtividadesRegionais() {
  try {
    console.log('=== VERIFICAÇÃO DE ATIVIDADES REGIONAIS ===\n');
    
    // 1. Buscar todas as atividades regionais ativas
    const { data: atividades, error } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('status', 'ativo')
      .order('regional', { ascending: true })
      .order('atividade_label', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar atividades:', error);
      return;
    }
    
    console.log(`Total de atividades encontradas: ${atividades?.length || 0}\n`);
    
    // 2. Agrupar por regional e tipo de atividade
    const dadosPorRegional = {};
    const resumoGeral = {};
    
    atividades?.forEach(atividade => {
      const regional = atividade.regional || 'Sem Regional';
      const tipo = atividade.atividade_label || 'Outros';
      const quantidade = parseInt(atividade.quantidade) || 0;
      
      // Por regional
      if (!dadosPorRegional[regional]) {
        dadosPorRegional[regional] = {};
      }
      if (!dadosPorRegional[regional][tipo]) {
        dadosPorRegional[regional][tipo] = 0;
      }
      dadosPorRegional[regional][tipo] += quantidade;
      
      // Resumo geral
      if (!resumoGeral[tipo]) {
        resumoGeral[tipo] = 0;
      }
      resumoGeral[tipo] += quantidade;
    });
    
    // 3. Exibir dados por regional
    console.log('📊 DADOS POR REGIONAL:');
    Object.entries(dadosPorRegional).forEach(([regional, tipos]) => {
      console.log(`\n🗺️ ${regional.toUpperCase()}:`);
      Object.entries(tipos).forEach(([tipo, quantidade]) => {
        console.log(`  - ${tipo}: ${quantidade}`);
      });
    });
    
    // 4. Resumo geral
    console.log('\n📈 RESUMO GERAL POR TIPO:');
    Object.entries(resumoGeral).forEach(([tipo, quantidade]) => {
      console.log(`  - ${tipo}: ${quantidade}`);
    });
    
    // 5. Dados específicos da regional SP
    console.log('\n🎯 DADOS ESPECÍFICOS DA REGIONAL SP:');
    const dadosSP = dadosPorRegional['SP'] || {};
    if (Object.keys(dadosSP).length > 0) {
      Object.entries(dadosSP).forEach(([tipo, quantidade]) => {
        console.log(`  - ${tipo}: ${quantidade}`);
      });
    } else {
      console.log('  Nenhuma atividade encontrada para SP');
    }
    
    // 6. Verificar metas por regional
    console.log('\n📋 METAS POR REGIONAL:');
    const { data: metas, error: metasError } = await supabase
      .from('goals')
      .select('regional, status');
    
    if (metasError) {
      console.error('Erro ao buscar metas:', metasError);
    } else {
      const metasPorRegional = {};
      const metasConcluidasPorRegional = {};
      
      metas?.forEach(meta => {
        const regional = meta.regional || 'Sem Regional';
        
        if (!metasPorRegional[regional]) {
          metasPorRegional[regional] = 0;
        }
        metasPorRegional[regional]++;
        
        if (meta.status === 'concluida') {
          if (!metasConcluidasPorRegional[regional]) {
            metasConcluidasPorRegional[regional] = 0;
          }
          metasConcluidasPorRegional[regional]++;
        }
      });
      
      Object.entries(metasPorRegional).forEach(([regional, total]) => {
        const concluidas = metasConcluidasPorRegional[regional] || 0;
        console.log(`  - ${regional}: ${total} metas (${concluidas} concluídas)`);
      });
    }
    
    // 7. Verificar dados específicos para os cards do dashboard
    console.log('\n🎯 DADOS PARA OS CARDS DO DASHBOARD:');
    
    const familiasEmbarcadas = resumoGeral['Famílias Embarcadas Decolagem'] || 0;
    const diagnosticosRealizados = resumoGeral['Diagnósticos Realizados'] || 0;
    const ligasMarasFormadas = resumoGeral['Ligas Maras Formadas'] || 0;
    
    console.log(`  - Famílias Embarcadas Decolagem: ${familiasEmbarcadas}`);
    console.log(`  - Diagnósticos Realizados: ${diagnosticosRealizados}`);
    console.log(`  - Ligas Maras Formadas: ${ligasMarasFormadas}`);
    
    // Dados específicos para SP
    const familiasEmbarcadasSP = dadosSP['Famílias Embarcadas Decolagem'] || 0;
    const diagnosticosRealizadosSP = dadosSP['Diagnósticos Realizados'] || 0;
    const ligasMarasFormadasSP = dadosSP['Ligas Maras Formadas'] || 0;
    
    console.log(`\n🎯 DADOS SP PARA OS CARDS:`);
    console.log(`  - Famílias Embarcadas Decolagem (SP): ${familiasEmbarcadasSP}`);
    console.log(`  - Diagnósticos Realizados (SP): ${diagnosticosRealizadosSP}`);
    console.log(`  - Ligas Maras Formadas (SP): ${ligasMarasFormadasSP}`);
    
  } catch (err) {
    console.error('Erro:', err);
  }
}

// Executar a verificação
verificarAtividadesRegionais();