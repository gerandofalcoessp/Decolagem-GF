const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugDashboardSeptember() {
  console.log('🔍 DEBUG: Por que o Dashboard não mostra atividades de setembro?\n');
  
  try {
    // 1. Verificar se as variáveis de ambiente estão corretas
    console.log('1. CONFIGURAÇÃO:');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Definida' : 'NÃO DEFINIDA');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Definida' : 'NÃO DEFINIDA');
    
    // 2. Buscar todas as metas (que é o que o Dashboard usa para determinar mesComDados)
    console.log('\n2. METAS NO BANCO (usado pelo Dashboard para mesComDados):');
    const { data: metas, error: metasError } = await supabase
      .from('goals')
      .select('*');
      
    if (metasError) {
      console.log('❌ Erro ao buscar metas:', metasError.message);
      return;
    }
    
    console.log(`Total de metas encontradas: ${metas?.length || 0}`);
    
    if (metas && metas.length > 0) {
      console.log('\nAnálise das datas nas metas:');
      
      const metasPorMes = {};
      const metasComDataInicio = [];
      const metasComDataInicioField = [];
      const metasComCreatedAt = [];
      
      metas.forEach((meta, index) => {
        console.log(`\nMeta ${index + 1}:`);
        console.log(`  ID: ${meta.id}`);
        console.log(`  Título: ${meta.titulo || meta.title || 'Sem título'}`);
        console.log(`  dataInicio: ${meta.dataInicio || 'null'}`);
        console.log(`  data_inicio: ${meta.data_inicio || 'null'}`);
        console.log(`  created_at: ${meta.created_at || 'null'}`);
        
        // Simular a lógica do Dashboard para extrair o mês
        let mesExtraido = null;
        
        if (meta.dataInicio) {
          const date = new Date(meta.dataInicio);
          if (!isNaN(date.getTime())) {
            mesExtraido = (date.getMonth() + 1).toString();
            metasComDataInicio.push(meta);
            console.log(`  → Mês extraído de dataInicio: ${mesExtraido}`);
          }
        } else if (meta.data_inicio) {
          const date = new Date(meta.data_inicio);
          if (!isNaN(date.getTime())) {
            mesExtraido = (date.getMonth() + 1).toString();
            metasComDataInicioField.push(meta);
            console.log(`  → Mês extraído de data_inicio: ${mesExtraido}`);
          }
        } else if (meta.created_at) {
          const date = new Date(meta.created_at);
          if (!isNaN(date.getTime())) {
            mesExtraido = (date.getMonth() + 1).toString();
            metasComCreatedAt.push(meta);
            console.log(`  → Mês extraído de created_at: ${mesExtraido}`);
          }
        }
        
        if (mesExtraido) {
          if (!metasPorMes[mesExtraido]) metasPorMes[mesExtraido] = 0;
          metasPorMes[mesExtraido]++;
        }
      });
      
      console.log('\n3. RESUMO DAS DATAS:');
      console.log(`Metas com dataInicio: ${metasComDataInicio.length}`);
      console.log(`Metas com data_inicio: ${metasComDataInicioField.length}`);
      console.log(`Metas com created_at: ${metasComCreatedAt.length}`);
      
      console.log('\n4. METAS POR MÊS (como o Dashboard vê):');
      const nomesMeses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                         'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      for (let mes = 1; mes <= 12; mes++) {
        const mesStr = mes.toString();
        const quantidade = metasPorMes[mesStr] || 0;
        console.log(`  ${nomesMeses[mes]} (${mesStr}): ${quantidade} metas`);
        
        if (mes === 9) {
          console.log(`  ⚠️  SETEMBRO: ${quantidade} metas encontradas`);
          if (quantidade === 0) {
            console.log('  ❌ PROBLEMA: Dashboard considera que setembro NÃO tem dados!');
          } else {
            console.log('  ✅ Dashboard deveria mostrar dados de setembro');
          }
        }
      }
    }
    
    // 3. Verificar atividades regionais (que existem mas não são usadas para mesComDados)
    console.log('\n5. ATIVIDADES REGIONAIS (existem mas não afetam mesComDados):');
    const { data: atividades, error: atividadesError } = await supabase
      .from('regional_activities')
      .select('*')
      .gte('activity_date', '2025-09-01')
      .lt('activity_date', '2025-10-01');
      
    if (atividadesError) {
      console.log('❌ Erro ao buscar atividades:', atividadesError.message);
    } else {
      console.log(`Atividades de setembro encontradas: ${atividades?.length || 0}`);
      if (atividades && atividades.length > 0) {
        console.log('⚠️  ESTAS ATIVIDADES EXISTEM MAS NÃO SÃO CONSIDERADAS PELO mesComDados!');
      }
    }
    
    // 4. Conclusão e solução
    console.log('\n6. DIAGNÓSTICO:');
    console.log('O problema está na lógica mesComDados do Dashboard.');
    console.log('O Dashboard só considera que um mês "tem dados" se existirem METAS para aquele mês.');
    console.log('As ATIVIDADES REGIONAIS não são consideradas na lógica mesComDados.');
    console.log('');
    console.log('SOLUÇÕES POSSÍVEIS:');
    console.log('1. Modificar a lógica mesComDados para considerar também atividades regionais');
    console.log('2. Criar metas para setembro de 2025');
    console.log('3. Remover a verificação mesComDados quando há atividades regionais');
    
  } catch (err) {
    console.error('Erro:', err);
  }
}

debugDashboardSeptember();