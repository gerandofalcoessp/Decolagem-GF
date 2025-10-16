const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqhqjqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWhxanFqcWpxanFqcWpxanFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDU0NzI2NywiZXhwIjoyMDUwMTIzMjY3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDashboardCalculation() {
  try {
    console.log('🔍 Debug do cálculo do Dashboard - Famílias Embarcadas');
    console.log('='.repeat(60));

    // 1. Buscar dados diretamente do Supabase (simulando o que a API faria)
    console.log('\n1. Buscando dados diretamente do Supabase...');
    
    const { data: apiData, error } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('status', 'ativo');

    if (error) {
      throw new Error(`Supabase Error: ${error.message}`);
    }

    console.log(`✅ Supabase retornou: ${Array.isArray(apiData) ? apiData.length : 'não é array'} atividades`);

    // 2. Processar dados como o dashboard faz
    console.log('\n2. Processando dados como o dashboard...');
    
    // Simular a lógica do useMemo do dashboard
    const activitiesArray = Array.isArray(apiData) 
      ? apiData 
      : Array.isArray(apiData?.data) 
        ? apiData.data
        : [];

    console.log(`✅ activitiesArray processado: ${activitiesArray.length} atividades`);

    // 3. Implementar as funções exatas do dashboard
    const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
    
    const canonicalizeTokens = (s) => {
      const na = normalize(s).replace(/[^a-z0-9]+/g, ' ');
      const rawTokens = na.split(/\s+/).filter(Boolean);
      return rawTokens.map(t => {
        let tok = t;
        // singularizar básico
        if (tok.endsWith('s')) tok = tok.slice(0, -1);
        // mapeamentos de sinônimos comuns
        const map = {
          ongs: 'ong', ong: 'ong',
          ligas: 'liga', liga: 'liga',
          diagnosticos: 'diagnostico', diagnostico: 'diagnostico',
          familias: 'familia', familia: 'familia',
          retençao: 'retencao', retencao: 'retencao',
          nps: 'nps',
          maras: 'maras', mara: 'maras',
          decolagem: 'decolagem',
          nacional: 'nacional'
        };
        return map[tok] || tok;
      });
    };

    const isStringMatch = (a, b) => {
      const ta = canonicalizeTokens(a);
      const tb = canonicalizeTokens(b);
      if (ta.length === 0 || tb.length === 0) return false;
      const setA = new Set(ta);
      const inter = tb.filter(x => setA.has(x));
      // Se o label contém "decolagem" ou "maras", exigir que esse token esteja presente
      const requireProgramToken = tb.includes('decolagem') || tb.includes('maras');
      const hasProgramToken = inter.includes('decolagem') || inter.includes('maras');
      const requiredOverlap = Math.min(tb.length, 2); // exigir ao menos 2 tokens quando houver 2 ou mais
      if (requireProgramToken) {
        // Exigir o token do programa + ao menos outro token significativo
        return hasProgramToken && inter.length >= requiredOverlap;
      }
      // Caso geral: exigir ao menos 2 tokens (ou todos, quando só houver 2)
      return inter.length >= requiredOverlap;
    };

    const doesActivityMatch = (activity, label) => {
      const fields = [
        activity.atividade_label,
        activity.titulo,
        activity.tipo,
        activity.categoria
      ].filter(Boolean);
      return fields.some(f => isStringMatch(f, label));
    };

    const sumActivitiesByLabels = (labels, options = {}) => {
      return activitiesArray.reduce((acc, a) => {
        const match = labels.some(l => doesActivityMatch(a, l));
        if (!match) return acc;
        if (options.todayOnly) {
          // Buscar a melhor data disponível na atividade
          const activityDate = a.activity_date || a.data_inicio || a.created_at || a.data || a.date;
          if (!isSameDay(activityDate)) return acc;
        }
        // Quantidade pode vir como string ou número e com diferentes nomes de campo
        const qRaw = a.quantidade ?? a.qtd ?? 1;
        const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
        return acc + (isNaN(numQ) ? 1 : numQ);
      }, 0);
    };

    // 4. Testar o cálculo exato do dashboard
    console.log('\n3. Testando cálculo exato do dashboard...');
    const testLabels = ['Famílias Embarcadas Decolagem', 'familias_embarcadas_decolagem'];
    console.log(`Labels de teste: ${JSON.stringify(testLabels)}`);

    // Debug detalhado de cada atividade
    console.log('\n4. Debug detalhado de cada atividade:');
    let matchingActivities = [];
    let totalSum = 0;

    activitiesArray.forEach((activity, index) => {
      const match = testLabels.some(l => doesActivityMatch(activity, l));
      
      if (match) {
        const qRaw = activity.quantidade ?? activity.qtd ?? 1;
        const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
        const quantidade = isNaN(numQ) ? 1 : numQ;
        
        matchingActivities.push({
          index: index + 1,
          id: activity.id,
          atividade_label: activity.atividade_label,
          titulo: activity.titulo,
          tipo: activity.tipo,
          quantidade: quantidade,
          quantidadeRaw: qRaw,
          regional: activity.regional
        });
        
        totalSum += quantidade;
        
        console.log(`  ✅ Match ${matchingActivities.length}:`);
        console.log(`     ID: ${activity.id}`);
        console.log(`     Label: "${activity.atividade_label}"`);
        console.log(`     Título: "${activity.titulo}"`);
        console.log(`     Quantidade: ${quantidade} (raw: ${qRaw}, tipo: ${typeof qRaw})`);
        console.log(`     Regional: ${activity.regional}`);
        console.log('');
      }
    });

    // 5. Resultado final usando a função do dashboard
    const familiasEmbarcadasRealizado = sumActivitiesByLabels(testLabels);
    
    console.log('\n5. Resultado final:');
    console.log(`🧮 Soma manual: ${totalSum}`);
    console.log(`🧮 sumActivitiesByLabels: ${familiasEmbarcadasRealizado}`);
    console.log(`📊 Total de atividades que fazem match: ${matchingActivities.length}`);
    
    // 6. Verificar se há diferença entre os cálculos
    if (totalSum === familiasEmbarcadasRealizado) {
      console.log('✅ Cálculos consistentes!');
    } else {
      console.log('❌ Diferença entre cálculos!');
    }

    // 7. Mostrar estrutura de uma atividade para debug
    if (activitiesArray.length > 0) {
      console.log('\n6. Estrutura de uma atividade de exemplo:');
      console.log(JSON.stringify(activitiesArray[0], null, 2));
    }

    // 8. Verificar se o problema pode estar no formato dos dados
    console.log('\n7. Verificação de formato dos dados:');
    console.log(`Tipo de activitiesArray: ${Array.isArray(activitiesArray) ? 'Array' : typeof activitiesArray}`);
    console.log(`Primeiro elemento é objeto: ${typeof activitiesArray[0] === 'object'}`);
    
    if (activitiesArray.length > 0) {
      const firstActivity = activitiesArray[0];
      console.log(`Campos disponíveis: ${Object.keys(firstActivity).join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  }
}

// Executar o debug
debugDashboardCalculation();