const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTotalLeadsFix() {
  console.log('🧪 Testando correção do card Total de Leads...\n');

  try {
    // 1. Fazer login
    console.log('1. 🔐 Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'flavio.almeida@gerandofalcoes.com',
      password: '123456'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }

    console.log('✅ Login realizado com sucesso!');

    // 2. Buscar atividades regionais
    console.log('\n2. 📊 Buscando atividades regionais...');
    const { data: activities, error: activitiesError } = await supabase
      .from('regional_activities')
      .select('*');

    if (activitiesError) {
      console.error('❌ Erro ao buscar atividades:', activitiesError);
      return;
    }

    console.log(`✅ ${activities.length} atividades encontradas`);

    // 3. Função para normalizar strings (igual ao dashboard)
    const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

    const canonicalizeTokens = (s) => {
      const normalized = normalize(s);
      return normalized.split(/[\s_-]+/).filter(t => t.length > 0);
    };

    const isStringMatch = (activityStr, targetStr) => {
      const activityTokens = canonicalizeTokens(activityStr);
      const targetTokens = canonicalizeTokens(targetStr);
      
      if (activityTokens.length === 0 || targetTokens.length === 0) return false;
      
      return targetTokens.every(targetToken => 
        activityTokens.some(activityToken => 
          activityToken.includes(targetToken) || targetToken.includes(activityToken)
        )
      );
    };

    const doesActivityMatch = (activity, label) => {
      const activityLabel = activity.atividade_label || '';
      const titulo = activity.titulo || '';
      const tipo = activity.tipo || '';
      
      return isStringMatch(activityLabel, label) || 
             isStringMatch(titulo, label) || 
             isStringMatch(tipo, label);
    };

    // 4. Testar contagem de Leads do dia
    console.log('\n3. 🎯 Testando contagem de Leads do dia...');
    const leadsDoDiaLabels = ['Leads do dia', 'Leads do Dia', 'leads_do_dia'];
    
    let leadsDoDiaCount = 0;
    let leadsDoDiaActivities = [];
    
    activities.forEach(activity => {
      const matches = leadsDoDiaLabels.some(label => doesActivityMatch(activity, label));
      if (matches) {
        leadsDoDiaActivities.push(activity);
        const qRaw = activity.quantidade ?? activity.qtd ?? 1;
        const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
        leadsDoDiaCount += isNaN(numQ) ? 1 : numQ;
      }
    });

    console.log(`📊 Atividades "Leads do dia" encontradas: ${leadsDoDiaActivities.length}`);
    console.log(`🧮 Total "Leads do dia": ${leadsDoDiaCount}`);

    // 5. Testar contagem de Leads Maras
    console.log('\n4. 🎯 Testando contagem de Leads Maras...');
    const leadsMarasLabels = ['leads_maras', 'leads maras'];
    
    let leadsMarasCount = 0;
    let leadsMarasActivities = [];
    
    activities.forEach(activity => {
      const tipo = activity.tipo || '';
      const matches = leadsMarasLabels.some(label => 
        tipo.toLowerCase() === label || tipo.toLowerCase().includes(label)
      );
      if (matches) {
        leadsMarasActivities.push(activity);
        const qRaw = activity.quantidade ?? activity.qtd ?? 1;
        const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
        leadsMarasCount += isNaN(numQ) ? 1 : numQ;
      }
    });

    console.log(`📊 Atividades "Leads Maras" encontradas: ${leadsMarasActivities.length}`);
    console.log(`🧮 Total "Leads Maras": ${leadsMarasCount}`);

    // 6. Verificar se Total de Leads = Leads do dia (não deve incluir Leads Maras)
    console.log('\n5. ✅ Verificação da correção:');
    console.log(`   Leads do dia: ${leadsDoDiaCount}`);
    console.log(`   Leads Maras: ${leadsMarasCount}`);
    console.log(`   Total de Leads (correto): ${leadsDoDiaCount} (apenas Leads do dia)`);
    console.log(`   Total de Leads (incorreto seria): ${leadsDoDiaCount + leadsMarasCount} (incluindo Leads Maras)`);

    if (leadsDoDiaActivities.length > 0) {
      console.log('\n📋 Atividades "Leads do dia" encontradas:');
      leadsDoDiaActivities.slice(0, 5).forEach((activity, i) => {
        console.log(`   ${i + 1}. ID: ${activity.id} | Label: "${activity.atividade_label}" | Qtd: ${activity.quantidade}`);
      });
      if (leadsDoDiaActivities.length > 5) {
        console.log(`   ... e mais ${leadsDoDiaActivities.length - 5} atividades`);
      }
    }

    if (leadsMarasActivities.length > 0) {
      console.log('\n📋 Atividades "Leads Maras" encontradas:');
      leadsMarasActivities.slice(0, 5).forEach((activity, i) => {
        console.log(`   ${i + 1}. ID: ${activity.id} | Tipo: "${activity.tipo}" | Qtd: ${activity.quantidade}`);
      });
      if (leadsMarasActivities.length > 5) {
        console.log(`   ... e mais ${leadsMarasActivities.length - 5} atividades`);
      }
    }

    console.log('\n🎉 Teste concluído! O card "Total de Leads" agora deve mostrar apenas a soma de "Leads do dia".');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testTotalLeadsFix();