const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ixqkqvfkpbwrjdyqzjpx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWtxdmZrcGJ3cmpkeXF6anB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3MzI4NzksImV4cCI6MjA0ODMwODg3OX0.Ej4rYXGKNOJuZgmJkbNJZvryFrBJx2_j-VJhRrGhKQs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDashboardLogic() {
  try {
    console.log('🔍 DEBUG DASHBOARD LOGIC - FAMÍLIAS EMBARCADAS DECOLAGEM');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // 1. Fetch data exactly like the dashboard does (simulating /api/atividades endpoint)
    console.log('1. Buscando dados como o dashboard faz...');
    const { data: rawActivities, error } = await supabase
      .from('regional_activities')
      .select('*');

    if (error) {
      console.error('❌ Erro ao buscar atividades:', error.message);
      return;
    }

    console.log(`✅ ${rawActivities?.length || 0} registros encontrados`);

    // 2. Convert to activitiesArray format (like the dashboard does)
    const activitiesArray = Array.isArray(rawActivities) ? rawActivities : [];
    console.log(`📋 activitiesArray length: ${activitiesArray.length}`);

    // 3. Implement the exact dashboard logic for string matching
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

    const isSameDay = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    };

    // 4. Test the exact labels used in the dashboard
    const testLabels = ['Famílias Embarcadas Decolagem', 'familias_embarcadas_decolagem'];
    
    console.log('\n2. Testando matching de labels...');
    console.log(`Labels de teste: ${JSON.stringify(testLabels)}`);

    // Test each activity for matching
    let matchingActivities = [];
    activitiesArray.forEach((activity, index) => {
      const matches = testLabels.some(label => doesActivityMatch(activity, label));
      if (matches) {
        matchingActivities.push({
          index,
          id: activity.id,
          atividade_label: activity.atividade_label,
          titulo: activity.titulo,
          tipo: activity.tipo,
          quantidade: activity.quantidade,
          regional: activity.regional,
          status: activity.status
        });
      }
    });

    console.log(`✅ ${matchingActivities.length} atividades encontradas que fazem match`);

    if (matchingActivities.length > 0) {
      console.log('\n📋 Atividades que fazem match:');
      matchingActivities.forEach((activity, i) => {
        console.log(`  ${i + 1}. ID: ${activity.id}`);
        console.log(`     Label: "${activity.atividade_label}"`);
        console.log(`     Título: "${activity.titulo}"`);
        console.log(`     Tipo: "${activity.tipo}"`);
        console.log(`     Quantidade: ${activity.quantidade}`);
        console.log(`     Regional: ${activity.regional}`);
        console.log(`     Status: ${activity.status}`);
        console.log('');
      });
    }

    // 5. Calculate the sum using dashboard logic
    const result = sumActivitiesByLabels(testLabels);
    console.log(`🧮 Resultado do sumActivitiesByLabels: ${result}`);

    // 6. Debug the string matching for "Famílias Embarcadas Decolagem"
    console.log('\n3. Debug do string matching...');
    const targetLabel = 'Famílias Embarcadas Decolagem';
    const targetTokens = canonicalizeTokens(targetLabel);
    console.log(`Target label: "${targetLabel}"`);
    console.log(`Target tokens: ${JSON.stringify(targetTokens)}`);

    // Test against actual activity labels
    const uniqueLabels = [...new Set(activitiesArray.map(a => a.atividade_label).filter(Boolean))];
    console.log('\n📝 Testando match contra todos os labels únicos:');
    uniqueLabels.forEach(label => {
      const tokens = canonicalizeTokens(label);
      const matches = isStringMatch(label, targetLabel);
      console.log(`  "${label}" -> tokens: ${JSON.stringify(tokens)} -> match: ${matches}`);
    });

    // 7. Check if there are any "Famílias Embarcadas Decolagem" records
    const exactMatches = activitiesArray.filter(a => a.atividade_label === 'Famílias Embarcadas Decolagem');
    console.log(`\n4. Registros com label exato "Famílias Embarcadas Decolagem": ${exactMatches.length}`);
    
    if (exactMatches.length > 0) {
      const totalExact = exactMatches.reduce((sum, a) => {
        const qRaw = a.quantidade ?? a.qtd ?? 1;
        const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
        return sum + (isNaN(numQ) ? 1 : numQ);
      }, 0);
      console.log(`   Total quantidade (match exato): ${totalExact}`);
    }

    console.log('\n✅ Debug concluído!');

  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
  }
}

debugDashboardLogic();