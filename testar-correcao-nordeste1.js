const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ixqjqhqxqhqxqhqx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHF4cWhxeHFocXgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzU1MzIwMCwiZXhwIjoyMDUzMTI5MjAwfQ.abc123';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testarCorrecaoNordeste1() {
  try {
    console.log('=== TESTANDO CORREÇÃO PARA NORDESTE 1 ===\n');
    
    // 1. Verificar instituições do Nordeste 1
    console.log('1. INSTITUIÇÕES DO NORDESTE 1:');
    const { data: instituicoes, error: instituicoesError } = await supabase
      .from('institutions')
      .select('*')
      .ilike('regional', 'nordeste_1');
    
    if (instituicoesError) {
      console.error('Erro ao buscar instituições:', instituicoesError);
    } else {
      console.log(`Total de instituições encontradas: ${instituicoes?.length || 0}`);
      
      if (instituicoes && instituicoes.length > 0) {
        instituicoes.forEach((inst, index) => {
          console.log(`  ${index + 1}. Nome: ${inst.nome}`);
          console.log(`     Regional: ${inst.regional}`);
          console.log(`     Tipo/Programa: ${inst.tipo_programa || inst.programa || 'N/A'}`);
          console.log(`     Status: ${inst.status || 'N/A'}`);
          console.log('');
        });
        
        // Contar por programa
        const ongsMaras = instituicoes.filter(inst => 
          inst.tipo_programa?.toLowerCase().includes('maras') || 
          inst.programa?.toLowerCase().includes('maras')
        ).length;
        
        const ongsDecolagem = instituicoes.filter(inst => 
          inst.tipo_programa?.toLowerCase().includes('decolagem') || 
          inst.programa?.toLowerCase().includes('decolagem')
        ).length;
        
        console.log('CONTAGEM POR PROGRAMA:');
        console.log(`  - ONGs Maras: ${ongsMaras}`);
        console.log(`  - ONGs Decolagem: ${ongsDecolagem}`);
        console.log(`  - Total de Instituições: ${instituicoes.length}`);
      }
    }
    
    // 2. Verificar atividades regionais do Nordeste 1
    console.log('\n2. ATIVIDADES REGIONAIS DO NORDESTE 1:');
    const { data: atividades, error: atividadesError } = await supabase
      .from('regional_activities')
      .select('*')
      .ilike('regional', 'nordeste_1')
      .eq('status', 'ativo');
    
    if (atividadesError) {
      console.error('Erro ao buscar atividades:', atividadesError);
    } else {
      console.log(`Total de atividades: ${atividades?.length || 0}`);
      
      if (atividades && atividades.length > 0) {
        const resumoAtividades = {};
        atividades.forEach(atividade => {
          const tipo = atividade.atividade_label || atividade.titulo || 'Outros';
          if (!resumoAtividades[tipo]) {
            resumoAtividades[tipo] = 0;
          }
          resumoAtividades[tipo] += parseInt(atividade.quantidade) || 0;
        });
        
        console.log('Resumo das atividades:');
        Object.entries(resumoAtividades).forEach(([tipo, total]) => {
          console.log(`  - ${tipo}: ${total}`);
        });
      }
    }
    
    console.log('\n=== RESULTADO ESPERADO NO DASHBOARD ===');
    console.log('Com a correção implementada, o dashboard deve mostrar:');
    console.log(`- Total de Instituições: ${instituicoes?.length || 0} (baseado na tabela institutions)`);
    console.log('- ONGs Maras: baseado no campo tipo_programa/programa das instituições');
    console.log('- ONGs Decolagem: baseado no campo tipo_programa/programa das instituições');
    console.log('\nAntes da correção, mostrava 0 porque dependia apenas das atividades regionais.');
    console.log('Agora deve mostrar o número real de instituições cadastradas para Nordeste 1.');
    
  } catch (err) {
    console.error('Erro:', err);
  }
}

testarCorrecaoNordeste1();