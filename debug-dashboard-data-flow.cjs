const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ixqkqvfkpbwrjdyqzjpx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWtxdmZrcGJ3cmpkeXF6anB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3MzI4NzksImV4cCI6MjA0ODMwODg3OX0.Ej4rYXGKNOJuZgmJkbNJZvryFrBJx2_j-VJhRrGhKQs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDashboardDataFlow() {
  try {
    console.log('🔍 DEBUG DASHBOARD DATA FLOW - FAMÍLIAS EMBARCADAS DECOLAGEM');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // 1. Simulate the exact API endpoint query (from activities.ts)
    console.log('1. Simulando query do endpoint /api/atividades...');
    
    const { data: rawData, error } = await supabase
      .from('regional_activities')
      .select(`
        *,
        responsavel:usuarios(nome, email)
      `);

    if (error) {
      console.log('❌ Erro com join, tentando sem join...');
      
      // Try without the join (like our previous successful query)
      const { data: rawDataNoJoin, error: errorNoJoin } = await supabase
        .from('regional_activities')
        .select('*');

      if (errorNoJoin) {
        console.error('❌ Erro ao buscar dados:', errorNoJoin.message);
        return;
      }

      console.log(`✅ ${rawDataNoJoin?.length || 0} registros encontrados (sem join)`);
      
      // Map the data like the API endpoint does (without responsavel)
      const mappedData = rawDataNoJoin.map(item => ({
        id: item.id,
        titulo: item.titulo,
        descricao: item.descricao,
        activity_date: item.activity_date,
        tipo: item.tipo,
        atividade_label: item.atividade_label,
        quantidade: item.quantidade,
        regional: item.regional,
        status: item.status,
        created_at: item.created_at,
        // responsavel: null // No join available
      }));

      console.log('📋 Dados mapeados como o endpoint faria');
      
      // 2. Simulate how useActivities processes the data
      console.log('\n2. Simulando processamento do useActivities...');
      
      // The useActivities hook expects result.data || result
      const activitiesData = mappedData; // This would be result.data or result
      console.log(`✅ activitiesData length: ${activitiesData.length}`);
      
      // 3. Simulate dashboard processing
      console.log('\n3. Simulando processamento do dashboard...');
      
      // Convert to activitiesArray (like dashboard does)
      const activitiesArray = Array.isArray(activitiesData) ? activitiesData : [];
      console.log(`📋 activitiesArray length: ${activitiesArray.length}`);
      
      // 4. Find "Famílias Embarcadas Decolagem" records
      console.log('\n4. Procurando registros "Famílias Embarcadas Decolagem"...');
      
      const exactMatches = activitiesArray.filter(a => a.atividade_label === 'Famílias Embarcadas Decolagem');
      console.log(`✅ ${exactMatches.length} registros com match exato`);
      
      if (exactMatches.length > 0) {
        console.log('\n📋 Registros com match exato:');
        let totalExact = 0;
        
        exactMatches.forEach((record, i) => {
          console.log(`  ${i + 1}. ID: ${record.id}`);
          console.log(`     Título: "${record.titulo}"`);
          console.log(`     Label: "${record.atividade_label}"`);
          console.log(`     Quantidade: ${record.quantidade} (tipo: ${typeof record.quantidade})`);
          console.log(`     Regional: ${record.regional}`);
          console.log(`     Status: ${record.status}`);
          console.log('');
          
          const qRaw = record.quantidade ?? record.qtd ?? 1;
          const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
          totalExact += isNaN(numQ) ? 1 : numQ;
        });
        
        console.log(`🧮 Total quantidade (match exato): ${totalExact}`);
      }
      
      // 5. Test dashboard's sumActivitiesByLabels logic
      console.log('\n5. Testando lógica sumActivitiesByLabels...');
      
      // Implement the exact dashboard logic
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

      // Test with the exact labels from dashboard
      const testLabels = ['Famílias Embarcadas Decolagem', 'familias_embarcadas_decolagem'];
      const result = sumActivitiesByLabels(testLabels);
      
      console.log(`🧮 Resultado sumActivitiesByLabels: ${result}`);
      
      // 6. Debug each step of the matching process
      console.log('\n6. Debug detalhado do matching...');
      
      let matchingCount = 0;
      activitiesArray.forEach((activity, index) => {
        const matches = testLabels.some(label => doesActivityMatch(activity, label));
        if (matches) {
          matchingCount++;
          console.log(`  Match ${matchingCount}: ID ${activity.id}`);
          console.log(`    Label: "${activity.atividade_label}"`);
          console.log(`    Título: "${activity.titulo}"`);
          console.log(`    Quantidade: ${activity.quantidade}`);
          
          // Test each label individually
          testLabels.forEach(label => {
            const individualMatch = doesActivityMatch(activity, label);
            console.log(`    Match com "${label}": ${individualMatch}`);
          });
          console.log('');
        }
      });
      
      console.log(`✅ Total de atividades que fazem match: ${matchingCount}`);
      
      // 7. Show all unique labels for comparison
      console.log('\n7. Todos os labels únicos na base:');
      const uniqueLabels = [...new Set(activitiesArray.map(a => a.atividade_label).filter(Boolean))];
      uniqueLabels.forEach(label => {
        const count = activitiesArray.filter(a => a.atividade_label === label).length;
        console.log(`  "${label}" (${count} registros)`);
      });
      
      console.log('\n✅ Debug concluído!');
    }

  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
  }
}

debugDashboardDataFlow();