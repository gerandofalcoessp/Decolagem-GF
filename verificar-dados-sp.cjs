const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ixqjqhqxqhqxqhqx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHF4cWhxeHFocXgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzU1MzIwMCwiZXhwIjoyMDUzMTI5MjAwfQ.abc123';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarDadosSP() {
  try {
    console.log('=== VERIFICAÇÃO DE DADOS REAIS PARA SP ===\n');
    
    // 1. Verificar metas para SP
    console.log('1. METAS PARA SP:');
    const { data: metas, error: metasError } = await supabase
      .from('goals')
      .select('*')
      .eq('regional', 'SP');
    
    if (metasError) {
      console.error('Erro ao buscar metas:', metasError);
    } else {
      console.log(`Total de metas SP: ${metas?.length || 0}`);
      const metasConcluidas = metas?.filter(m => m.status === 'concluida' || m.status === 'completed').length || 0;
      console.log(`Metas concluídas SP: ${metasConcluidas}`);
    }
    
    // 2. Verificar atividades regionais para SP
    console.log('\n2. ATIVIDADES REGIONAIS PARA SP:');
    const { data: atividades, error: atividadesError } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('regional', 'SP')
      .eq('status', 'ativo');
    
    if (atividadesError) {
      console.error('Erro ao buscar atividades:', atividadesError);
    } else {
      console.log(`Total de atividades SP: ${atividades?.length || 0}`);
      
      // Agrupar por tipo de atividade
      const atividadesPorTipo = {};
      let totalFamiliasEmbarcadas = 0;
      let totalLigasMaras = 0;
      let totalDiagnosticos = 0;
      
      atividades?.forEach(atividade => {
        const tipo = atividade.atividade_label || atividade.titulo || 'Outros';
        const quantidade = parseInt(atividade.quantidade) || 0;
        
        if (!atividadesPorTipo[tipo]) {
          atividadesPorTipo[tipo] = 0;
        }
        atividadesPorTipo[tipo] += quantidade;
        
        // Somar por categoria específica
        if (tipo.includes('Famílias Embarcadas') || tipo.includes('Decolagem')) {
          totalFamiliasEmbarcadas += quantidade;
        }
        if (tipo.includes('Ligas Maras') || tipo.includes('Formadas')) {
          totalLigasMaras += quantidade;
        }
        if (tipo.includes('Diagnósticos') || tipo.includes('Realizados')) {
          totalDiagnosticos += quantidade;
        }
      });
      
      console.log('Atividades por tipo:');
      Object.entries(atividadesPorTipo).forEach(([tipo, quantidade]) => {
        console.log(`  - ${tipo}: ${quantidade}`);
      });
      
      console.log(`\nTotais calculados:`);
      console.log(`  - Famílias Embarcadas: ${totalFamiliasEmbarcadas}`);
      console.log(`  - Ligas Maras Formadas: ${totalLigasMaras}`);
      console.log(`  - Diagnósticos Realizados: ${totalDiagnosticos}`);
    }
    
    // 3. Verificar instituições para SP
    console.log('\n3. INSTITUIÇÕES PARA SP:');
    const { data: instituicoes, error: instituicoesError } = await supabase
      .from('instituicoes_stats')
      .select('*')
      .eq('regional', 'SP');
    
    if (instituicoesError) {
      console.error('Erro ao buscar instituições:', instituicoesError);
    } else {
      console.log(`Total de instituições SP: ${instituicoes?.length || 0}`);
      
      let totalInstituicoes = 0;
      let ongsMaras = 0;
      let ongsDecolagem = 0;
      
      instituicoes?.forEach(inst => {
        totalInstituicoes++;
        if (inst.programa === 'Maras') {
          ongsMaras++;
        } else if (inst.programa === 'Decolagem') {
          ongsDecolagem++;
        }
      });
      
      console.log(`  - Total Instituições: ${totalInstituicoes}`);
      console.log(`  - ONGs Maras: ${ongsMaras}`);
      console.log(`  - ONGs Decolagem: ${ongsDecolagem}`);
    }
    
    // 4. Verificar dados específicos mencionados pelo usuário
    console.log('\n4. VERIFICAÇÃO DOS DADOS ESPECÍFICOS MENCIONADOS:');
    
    // Ligas Maras Formadas = 30
    const { data: ligasMaras } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('regional', 'SP')
      .eq('atividade_label', 'Ligas Maras Formadas')
      .eq('status', 'ativo');
    
    const totalLigasMarasDB = ligasMaras?.reduce((sum, item) => sum + (parseInt(item.quantidade) || 0), 0) || 0;
    console.log(`Ligas Maras Formadas (DB): ${totalLigasMarasDB}`);
    
    // Famílias Embarcadas Decolagem = 350
    const { data: familiasEmbarcadas } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('regional', 'SP')
      .eq('atividade_label', 'Famílias Embarcadas Decolagem')
      .eq('status', 'ativo');
    
    const totalFamiliasDB = familiasEmbarcadas?.reduce((sum, item) => sum + (parseInt(item.quantidade) || 0), 0) || 0;
    console.log(`Famílias Embarcadas Decolagem (DB): ${totalFamiliasDB}`);
    
    // Diagnósticos Realizados = 1100
    const { data: diagnosticos } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('regional', 'SP')
      .eq('atividade_label', 'Diagnósticos Realizados')
      .eq('status', 'ativo');
    
    const totalDiagnosticosDB = diagnosticos?.reduce((sum, item) => sum + (parseInt(item.quantidade) || 0), 0) || 0;
    console.log(`Diagnósticos Realizados (DB): ${totalDiagnosticosDB}`);
    
    console.log('\n=== COMPARAÇÃO COM DADOS INFORMADOS ===');
    console.log('Dados informados pelo usuário:');
    console.log('  - Ligas Maras Formadas: 30');
    console.log('  - Famílias Embarcadas Decolagem: 350');
    console.log('  - Diagnósticos Realizados: 1100');
    console.log('  - ONGs Decolagem: 1');
    console.log('  - ONGs Maras: 0');
    console.log('  - Total de Instituições: 1');
    console.log('  - Total de Metas: 3');
    
    console.log('\nDados encontrados no banco:');
    console.log(`  - Ligas Maras Formadas: ${totalLigasMarasDB}`);
    console.log(`  - Famílias Embarcadas Decolagem: ${totalFamiliasDB}`);
    console.log(`  - Diagnósticos Realizados: ${totalDiagnosticosDB}`);
    
  } catch (err) {
    console.error('Erro:', err);
  }
}

verificarDadosSP();