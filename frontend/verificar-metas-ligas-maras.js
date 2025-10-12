import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ixqjqhqxqhqxqhqx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHF4cWhxeHFocXgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzU1MzIwMCwiZXhwIjoyMDUzMTI5MjAwfQ.abc123';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarMetasLigasMaras() {
  try {
    console.log('=== INVESTIGAÇÃO: METAS DE LIGAS MARAS FORMADAS ===\n');
    
    // 1. Buscar metas com diferentes variações do nome
    console.log('1. BUSCANDO METAS COM VARIAÇÕES DO NOME:');
    
    const variacoes = [
      'Ligas Maras Formadas',
      'Liga Maras Formadas', 
      'Ligas Maras',
      'Liga Maras',
      'Maras Formadas',
      'Ligas',
      'Maras'
    ];
    
    for (const variacao of variacoes) {
      console.log(`\n   Buscando: "${variacao}"`);
      
      const { data: metas, error } = await supabase
        .from('goals')
        .select('*')
        .ilike('titulo', `%${variacao}%`);
      
      if (error) {
        console.error(`   ❌ Erro: ${error.message}`);
      } else {
        console.log(`   ✅ Encontradas: ${metas?.length || 0} metas`);
        
        if (metas && metas.length > 0) {
          metas.forEach((meta, index) => {
            console.log(`     ${index + 1}. ID: ${meta.id}`);
            console.log(`        Título: "${meta.titulo}"`);
            console.log(`        Regional: "${meta.regional}"`);
            console.log(`        Meta: ${meta.valor_meta || meta.valorMeta || 'N/A'}`);
            console.log(`        Atual: ${meta.valor_atual || meta.valorAtual || 'N/A'}`);
            console.log(`        Status: ${meta.status || 'N/A'}`);
            console.log(`        Criado: ${meta.created_at || 'N/A'}`);
            console.log('');
          });
        }
      }
    }
    
    // 2. Buscar atividades regionais de Ligas Maras
    console.log('\n2. BUSCANDO ATIVIDADES REGIONAIS:');
    
    for (const variacao of variacoes) {
      console.log(`\n   Buscando atividade: "${variacao}"`);
      
      const { data: atividades, error } = await supabase
        .from('regional_activities')
        .select('*')
        .ilike('atividade_label', `%${variacao}%`)
        .eq('status', 'ativo');
      
      if (error) {
        console.error(`   ❌ Erro: ${error.message}`);
      } else {
        console.log(`   ✅ Encontradas: ${atividades?.length || 0} atividades`);
        
        if (atividades && atividades.length > 0) {
          atividades.forEach((atividade, index) => {
            console.log(`     ${index + 1}. ID: ${atividade.id}`);
            console.log(`        Label: "${atividade.atividade_label}"`);
            console.log(`        Regional: "${atividade.regional}"`);
            console.log(`        Quantidade: ${atividade.quantidade}`);
            console.log(`        Status: ${atividade.status}`);
            console.log('');
          });
        }
      }
    }
    
    // 3. Listar todas as metas para análise
    console.log('\n3. TODAS AS METAS CADASTRADAS (primeiras 20):');
    
    const { data: todasMetas, error: errorTodasMetas } = await supabase
      .from('goals')
      .select('id, titulo, regional, valor_meta, valorMeta, status')
      .limit(20)
      .order('created_at', { ascending: false });
    
    if (errorTodasMetas) {
      console.error('❌ Erro ao buscar todas as metas:', errorTodasMetas.message);
    } else {
      console.log(`Total encontrado: ${todasMetas?.length || 0}`);
      
      if (todasMetas && todasMetas.length > 0) {
        todasMetas.forEach((meta, index) => {
          console.log(`   ${index + 1}. "${meta.titulo}" (${meta.regional}) - Meta: ${meta.valor_meta || meta.valorMeta || 'N/A'}`);
        });
      }
    }
    
    // 4. Listar todas as atividades para análise
    console.log('\n4. TODAS AS ATIVIDADES CADASTRADAS (primeiras 20):');
    
    const { data: todasAtividades, error: errorTodasAtividades } = await supabase
      .from('regional_activities')
      .select('id, atividade_label, regional, quantidade, status')
      .eq('status', 'ativo')
      .limit(20)
      .order('created_at', { ascending: false });
    
    if (errorTodasAtividades) {
      console.error('❌ Erro ao buscar todas as atividades:', errorTodasAtividades.message);
    } else {
      console.log(`Total encontrado: ${todasAtividades?.length || 0}`);
      
      if (todasAtividades && todasAtividades.length > 0) {
        todasAtividades.forEach((atividade, index) => {
          console.log(`   ${index + 1}. "${atividade.atividade_label}" (${atividade.regional}) - Qtd: ${atividade.quantidade}`);
        });
      }
    }
    
    console.log('\n=== FIM DA INVESTIGAÇÃO ===');
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

verificarMetasLigasMaras();