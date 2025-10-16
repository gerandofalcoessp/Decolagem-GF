require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const REGIONAL_LABELS = {
  'sp': 'São Paulo',
  'rj': 'Rio de Janeiro', 
  'mg': 'Minas Gerais',
  'pr': 'Paraná',
  'sc': 'Santa Catarina',
  'rs': 'Rio Grande do Sul',
  'ba': 'Bahia',
  'pe': 'Pernambuco',
  'ce': 'Ceará',
  'go': 'Goiás',
  'df': 'Distrito Federal',
  'mt': 'Mato Grosso',
  'ms': 'Mato Grosso do Sul',
  'nacional': 'Nacional',
  'nordeste_1': 'Nordeste 1',
  'nordeste_2': 'Nordeste 2'
};

async function debugFamiliasEmbarcadasFinal() {
  try {
    console.log('🔍 DEBUG FINAL - FAMÍLIAS EMBARCADAS DECOLAGEM');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // 1. Verificar se a tabela regional_activities existe e tem dados
    console.log('1. Verificando tabela regional_activities...');
    const { data: allActivities, error: allError } = await supabase
      .from('regional_activities')
      .select('*')
      .limit(5);

    if (allError) {
      console.error('❌ Erro ao acessar regional_activities:', allError.message);
      return;
    }

    console.log(`✅ Tabela acessível. Total de registros (amostra): ${allActivities?.length || 0}`);
    
    if (allActivities && allActivities.length > 0) {
      console.log('📋 Estrutura da tabela (primeiro registro):');
      Object.keys(allActivities[0]).forEach(field => {
        console.log(`  - ${field}: ${typeof allActivities[0][field]} = ${allActivities[0][field]}`);
      });
    }

    // 2. Buscar EXATAMENTE por "Famílias Embarcadas Decolagem"
    console.log('\n2. Buscando EXATAMENTE "Famílias Embarcadas Decolagem"...');
    const { data: familiasExatas, error: familiasError } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('atividade_label', 'Famílias Embarcadas Decolagem');

    if (familiasError) {
      console.error('❌ Erro ao buscar famílias exatas:', familiasError.message);
    } else {
      console.log(`✅ Encontradas ${familiasExatas?.length || 0} atividades com label exato`);
      
      if (familiasExatas && familiasExatas.length > 0) {
        let totalQuantidade = 0;
        console.log('\n📊 DADOS ENCONTRADOS:');
        
        familiasExatas.forEach((atividade, index) => {
          const quantidade = parseInt(atividade.quantidade) || 0;
          totalQuantidade += quantidade;
          
          console.log(`  ${index + 1}. Regional: ${atividade.regional || 'N/A'}`);
          console.log(`     Quantidade: ${quantidade}`);
          console.log(`     Status: ${atividade.status || 'N/A'}`);
          console.log(`     Data: ${atividade.activity_date || atividade.created_at || 'N/A'}`);
          console.log('');
        });
        
        console.log(`🎯 TOTAL GERAL: ${totalQuantidade} famílias embarcadas`);
        
        // Agrupar por regional
        const resumoPorRegional = {};
        familiasExatas.forEach(atividade => {
          const regional = atividade.regional || 'sem_regional';
          const regionalLabel = REGIONAL_LABELS[regional] || regional;
          const quantidade = parseInt(atividade.quantidade) || 0;
          
          if (!resumoPorRegional[regionalLabel]) {
            resumoPorRegional[regionalLabel] = 0;
          }
          resumoPorRegional[regionalLabel] += quantidade;
        });
        
        console.log('\n📍 RESUMO POR REGIONAL:');
        Object.entries(resumoPorRegional).forEach(([regional, total]) => {
          console.log(`  🏢 ${regional}: ${total} famílias`);
        });
      }
    }

    // 3. Buscar por variações do nome (case insensitive)
    console.log('\n3. Buscando variações do nome...');
    const { data: variacoes, error: variacoesError } = await supabase
      .from('regional_activities')
      .select('*')
      .or('atividade_label.ilike.%Famílias%Embarcadas%,atividade_label.ilike.%familias%embarcadas%,atividade_label.ilike.%Decolagem%');

    if (variacoesError) {
      console.error('❌ Erro ao buscar variações:', variacoesError.message);
    } else {
      console.log(`✅ Encontradas ${variacoes?.length || 0} atividades com variações do nome`);
      
      if (variacoes && variacoes.length > 0) {
        const labelsEncontrados = [...new Set(variacoes.map(v => v.atividade_label))];
        console.log('\n📝 Labels encontrados:');
        labelsEncontrados.forEach(label => {
          const atividades = variacoes.filter(v => v.atividade_label === label);
          const total = atividades.reduce((sum, a) => sum + (parseInt(a.quantidade) || 0), 0);
          console.log(`  - "${label}": ${atividades.length} registros, total: ${total}`);
        });
      }
    }

    // 4. Verificar todos os labels únicos na tabela
    console.log('\n4. Verificando TODOS os labels únicos...');
    const { data: todosLabels, error: todosLabelsError } = await supabase
      .from('regional_activities')
      .select('atividade_label')
      .not('atividade_label', 'is', null);

    if (todosLabelsError) {
      console.error('❌ Erro ao buscar todos os labels:', todosLabelsError.message);
    } else {
      const labelsUnicos = [...new Set(todosLabels?.map(l => l.atividade_label) || [])];
      console.log(`✅ Encontrados ${labelsUnicos.length} labels únicos`);
      
      console.log('\n📋 Todos os labels disponíveis:');
      labelsUnicos.sort().forEach((label, index) => {
        console.log(`  ${index + 1}. "${label}"`);
      });
      
      // Procurar labels que contenham palavras relacionadas
      const labelsRelacionados = labelsUnicos.filter(label => 
        label.toLowerCase().includes('família') || 
        label.toLowerCase().includes('embarcad') ||
        label.toLowerCase().includes('decolag')
      );
      
      if (labelsRelacionados.length > 0) {
        console.log('\n🔍 Labels relacionados encontrados:');
        labelsRelacionados.forEach(label => {
          console.log(`  - "${label}"`);
        });
      }
    }

    // 5. Verificar se há dados com status 'ativo'
    console.log('\n5. Verificando registros com status "ativo"...');
    const { data: ativos, error: ativosError } = await supabase
      .from('regional_activities')
      .select('atividade_label, quantidade, regional')
      .eq('status', 'ativo')
      .not('atividade_label', 'is', null);

    if (ativosError) {
      console.error('❌ Erro ao buscar registros ativos:', ativosError.message);
    } else {
      console.log(`✅ Encontrados ${ativos?.length || 0} registros com status "ativo"`);
      
      if (ativos && ativos.length > 0) {
        // Agrupar por label
        const ativosPorLabel = {};
        ativos.forEach(atividade => {
          const label = atividade.atividade_label;
          if (!ativosPorLabel[label]) {
            ativosPorLabel[label] = { count: 0, total: 0 };
          }
          ativosPorLabel[label].count++;
          ativosPorLabel[label].total += parseInt(atividade.quantidade) || 0;
        });
        
        console.log('\n📊 Resumo de atividades ativas por label:');
        Object.entries(ativosPorLabel)
          .sort(([,a], [,b]) => b.total - a.total)
          .slice(0, 10)
          .forEach(([label, dados]) => {
            console.log(`  - "${label}": ${dados.count} registros, total: ${dados.total}`);
          });
      }
    }

    console.log('\n✅ Debug concluído!');
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Se não há dados para "Famílias Embarcadas Decolagem", verificar se o nome está correto');
    console.log('2. Se há dados mas com nome diferente, atualizar a função sumActivitiesByLabels');
    console.log('3. Se não há dados, inserir dados de exemplo ou verificar migração');

  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
  }
}

debugFamiliasEmbarcadasFinal();