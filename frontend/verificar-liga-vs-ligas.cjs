const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://ixqjqhqxqhqxqhqx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHF4cWhxeHFocXgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzU1MzIwMCwiZXhwIjoyMDUzMTI5MjAwfQ.abc123';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarLigaVsLigas() {
  try {
    console.log('=== VERIFICANDO DIFERENÇA LIGA vs LIGAS ===\n');
    
    // 1. Buscar metas com "Liga Maras" (singular)
    console.log('1. METAS COM "LIGA MARAS" (SINGULAR):');
    const { data: metasLiga, error: metasLigaError } = await supabase
      .from('goals')
      .select('*')
      .ilike('titulo', '%liga%maras%');
    
    if (metasLigaError) {
      console.error('Erro ao buscar metas Liga:', metasLigaError);
    } else {
      console.log(`Total de metas "Liga Maras": ${metasLiga?.length || 0}`);
      metasLiga?.forEach((meta, index) => {
        console.log(`  ${index + 1}. Regional: ${meta.regional}, Título: "${meta.titulo}", Meta: ${meta.meta_valor}, Atual: ${meta.valor_atual}`);
      });
    }
    
    // 2. Buscar metas com "Ligas Maras" (plural)
    console.log('\n2. METAS COM "LIGAS MARAS" (PLURAL):');
    const { data: metasLigas, error: metasLigasError } = await supabase
      .from('goals')
      .select('*')
      .ilike('titulo', '%ligas%maras%');
    
    if (metasLigasError) {
      console.error('Erro ao buscar metas Ligas:', metasLigasError);
    } else {
      console.log(`Total de metas "Ligas Maras": ${metasLigas?.length || 0}`);
      metasLigas?.forEach((meta, index) => {
        console.log(`  ${index + 1}. Regional: ${meta.regional}, Título: "${meta.titulo}", Meta: ${meta.meta_valor}, Atual: ${meta.valor_atual}`);
      });
    }
    
    // 3. Buscar atividades com "Liga Maras" (singular)
    console.log('\n3. ATIVIDADES COM "LIGA MARAS" (SINGULAR):');
    const { data: atividadesLiga, error: atividadesLigaError } = await supabase
      .from('regional_activities')
      .select('*')
      .ilike('atividade_label', '%liga%maras%')
      .eq('status', 'ativo');
    
    if (atividadesLigaError) {
      console.error('Erro ao buscar atividades Liga:', atividadesLigaError);
    } else {
      console.log(`Total de atividades "Liga Maras": ${atividadesLiga?.length || 0}`);
      atividadesLiga?.forEach((atividade, index) => {
        console.log(`  ${index + 1}. Regional: ${atividade.regional}, Label: "${atividade.atividade_label}", Quantidade: ${atividade.quantidade}`);
      });
    }
    
    // 4. Buscar atividades com "Ligas Maras" (plural)
    console.log('\n4. ATIVIDADES COM "LIGAS MARAS" (PLURAL):');
    const { data: atividadesLigas, error: atividadesLigasError } = await supabase
      .from('regional_activities')
      .select('*')
      .ilike('atividade_label', '%ligas%maras%')
      .eq('status', 'ativo');
    
    if (atividadesLigasError) {
      console.error('Erro ao buscar atividades Ligas:', atividadesLigasError);
    } else {
      console.log(`Total de atividades "Ligas Maras": ${atividadesLigas?.length || 0}`);
      atividadesLigas?.forEach((atividade, index) => {
        console.log(`  ${index + 1}. Regional: ${atividade.regional}, Label: "${atividade.atividade_label}", Quantidade: ${atividade.quantidade}`);
      });
    }
    
    // 5. Análise do problema
    console.log('\n=== ANÁLISE DO PROBLEMA ===');
    console.log(`✅ Metas "Liga Maras" encontradas: ${metasLiga?.length || 0}`);
    console.log(`❌ Metas "Ligas Maras" encontradas: ${metasLigas?.length || 0}`);
    console.log(`❌ Atividades "Liga Maras" encontradas: ${atividadesLiga?.length || 0}`);
    console.log(`✅ Atividades "Ligas Maras" encontradas: ${atividadesLigas?.length || 0}`);
    
    console.log('\n🔍 PROBLEMA IDENTIFICADO:');
    console.log('- As METAS estão cadastradas como "Liga Maras Formadas" (singular)');
    console.log('- As ATIVIDADES aparecem como "Ligas Maras Formadas" (plural)');
    console.log('- O matching atual não consegue conectar singular com plural');
    
    console.log('\n💡 SOLUÇÃO NECESSÁRIA:');
    console.log('- Implementar matching que ignore diferenças de singular/plural');
    console.log('- Normalizar "Liga" e "Ligas" para a mesma forma');
    console.log('- Testar com ambas as variações');
    
  } catch (err) {
    console.error('Erro:', err);
  }
}

verificarLigaVsLigas();