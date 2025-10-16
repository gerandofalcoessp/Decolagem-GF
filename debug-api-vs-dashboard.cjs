const fetch = require('node-fetch');

// Test the actual API endpoint that the dashboard uses
async function debugApiVsDashboard() {
  try {
    console.log('🔍 DEBUG API VS DASHBOARD - FAMÍLIAS EMBARCADAS DECOLAGEM');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // 1. Test the actual API endpoint
    console.log('1. Testando o endpoint /api/atividades...');
    
    const response = await fetch('http://localhost:3000/api/atividades', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Erro HTTP: ${response.status} ${response.statusText}`);
      return;
    }

    const result = await response.json();
    console.log(`✅ Resposta recebida. Tipo: ${typeof result}`);
    
    // Check the structure of the response
    let activitiesData;
    if (result.data) {
      activitiesData = result.data;
      console.log(`📋 Estrutura: { data: [...] } com ${activitiesData.length} itens`);
    } else if (Array.isArray(result)) {
      activitiesData = result;
      console.log(`📋 Estrutura: [...] com ${activitiesData.length} itens`);
    } else {
      console.log('❌ Estrutura de resposta não reconhecida:', typeof result);
      console.log('Primeiras propriedades:', Object.keys(result).slice(0, 5));
      return;
    }

    // 2. Find "Famílias Embarcadas Decolagem" records
    console.log('\n2. Procurando registros "Famílias Embarcadas Decolagem"...');
    
    const familiasRecords = activitiesData.filter(activity => 
      activity.atividade_label === 'Famílias Embarcadas Decolagem'
    );
    
    console.log(`✅ ${familiasRecords.length} registros encontrados`);
    
    if (familiasRecords.length > 0) {
      console.log('\n📋 Registros encontrados:');
      let totalQuantidade = 0;
      
      familiasRecords.forEach((record, i) => {
        console.log(`  ${i + 1}. ID: ${record.id}`);
        console.log(`     Título: "${record.titulo}"`);
        console.log(`     Label: "${record.atividade_label}"`);
        console.log(`     Quantidade: ${record.quantidade}`);
        console.log(`     Regional: ${record.regional}`);
        console.log(`     Status: ${record.status}`);
        console.log(`     Data: ${record.activity_date}`);
        console.log('');
        
        const qty = parseFloat(record.quantidade) || 0;
        totalQuantidade += qty;
      });
      
      console.log(`🧮 Total de famílias: ${totalQuantidade}`);
    }

    // 3. Test dashboard matching logic
    console.log('\n3. Testando lógica de matching do dashboard...');
    
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

    // Test the matching
    const testLabels = ['Famílias Embarcadas Decolagem', 'familias_embarcadas_decolagem'];
    let matchingActivities = [];
    
    activitiesData.forEach((activity, index) => {
      const matches = testLabels.some(label => doesActivityMatch(activity, label));
      if (matches) {
        matchingActivities.push(activity);
      }
    });

    console.log(`✅ ${matchingActivities.length} atividades fazem match com a lógica do dashboard`);

    if (matchingActivities.length > 0) {
      const totalMatched = matchingActivities.reduce((sum, a) => {
        const qRaw = a.quantidade ?? a.qtd ?? 1;
        const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
        return sum + (isNaN(numQ) ? 1 : numQ);
      }, 0);
      console.log(`🧮 Total usando lógica do dashboard: ${totalMatched}`);
    }

    // 4. Debug the string matching process
    console.log('\n4. Debug detalhado do string matching...');
    const targetLabel = 'Famílias Embarcadas Decolagem';
    const targetTokens = canonicalizeTokens(targetLabel);
    console.log(`Target label: "${targetLabel}"`);
    console.log(`Target tokens: ${JSON.stringify(targetTokens)}`);

    // Test against a few sample labels
    const sampleLabels = [
      'Famílias Embarcadas Decolagem',
      'familias_embarcadas_decolagem',
      'Famílias Embarcadas',
      'Decolagem'
    ];

    sampleLabels.forEach(label => {
      const tokens = canonicalizeTokens(label);
      const matches = isStringMatch(label, targetLabel);
      console.log(`  "${label}" -> tokens: ${JSON.stringify(tokens)} -> match: ${matches}`);
    });

    console.log('\n✅ Debug concluído!');

  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Dica: Certifique-se de que o servidor está rodando em localhost:3000');
    }
  }
}

debugApiVsDashboard();