const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugRegionalMapping() {
  console.log('🔍 Debugando mapeamento regional...\n');

  try {
    // 1. Verificar todas as regionais únicas nas atividades
    console.log('1️⃣ Verificando regionais únicas nas atividades...');
    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from('regional_activities')
      .select('regional')
      .not('regional', 'is', null);

    if (activitiesError) {
      console.error('❌ Erro ao buscar atividades:', activitiesError);
      return;
    }

    const uniqueRegionals = [...new Set(activities.map(a => a.regional))];
    console.log('📊 Regionais encontradas nas atividades:', uniqueRegionals);
    console.log('📈 Total de atividades:', activities.length);

    // 2. Verificar todas as regionais únicas nos eventos do calendário
    console.log('\n2️⃣ Verificando regionais únicas nos eventos...');
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('calendar_events')
      .select('regional')
      .not('regional', 'is', null);

    if (eventsError) {
      console.error('❌ Erro ao buscar eventos:', eventsError);
      return;
    }

    const uniqueEventRegionals = [...new Set(events.map(e => e.regional))];
    console.log('📊 Regionais encontradas nos eventos:', uniqueEventRegionals);
    console.log('📈 Total de eventos:', events.length);

    // 3. Testar mapeamento específico para "R. Centro-Oeste"
    console.log('\n3️⃣ Testando mapeamento para "R. Centro-Oeste"...');
    const userRegional = 'R. Centro-Oeste';
    
    const mapUserRegionalToActivityFormat = (regional) => {
      if (!regional) return '';
      
      const mapping = {
        'R. Norte': 'norte',
        'R. Centro-Oeste': 'centro_oeste',
        'R. Nordeste': 'nordeste',
        'R. Sudeste': 'sudeste',
        'R. Sul': 'sul',
        'R. MG/ES': 'mg_es',
        'R. Rio de Janeiro': 'rj',
        'R. São Paulo': 'sp',
        'R. Nordeste 1': 'nordeste_1',
        'R. Nordeste 2': 'nordeste_2',
        'Nacional': 'nacional',
        'Comercial': 'comercial',
        // Casos já no formato correto
        'norte': 'norte',
        'centro_oeste': 'centro_oeste',
        'nordeste': 'nordeste',
        'sudeste': 'sudeste',
        'sul': 'sul',
        'mg_es': 'mg_es',
        'rj': 'rj',
        'sp': 'sp',
        'nordeste_1': 'nordeste_1',
        'nordeste_2': 'nordeste_2',
        'nacional': 'nacional',
        'comercial': 'comercial'
      };
      
      return mapping[regional] || regional.toLowerCase();
    };

    const mappedRegional = mapUserRegionalToActivityFormat(userRegional);
    console.log('🔄 Mapeamento:', { original: userRegional, mapped: mappedRegional });

    // 4. Buscar atividades com a regional mapeada
    console.log('\n4️⃣ Buscando atividades com regional "centro_oeste"...');
    const { data: centroOesteActivities, error: centroOesteError } = await supabaseAdmin
      .from('regional_activities')
      .select('*')
      .eq('regional', 'centro_oeste');

    if (centroOesteError) {
      console.error('❌ Erro ao buscar atividades centro-oeste:', centroOesteError);
    } else {
      console.log('📊 Atividades encontradas para centro_oeste:', centroOesteActivities.length);
      if (centroOesteActivities.length > 0) {
        console.log('📋 Primeira atividade:', {
          id: centroOesteActivities[0].id,
          titulo: centroOesteActivities[0].titulo,
          regional: centroOesteActivities[0].regional,
          created_at: centroOesteActivities[0].created_at
        });
      }
    }

    // 5. Buscar eventos com a regional mapeada
    console.log('\n5️⃣ Buscando eventos com regional "centro_oeste"...');
    const { data: centroOesteEvents, error: centroOesteEventsError } = await supabaseAdmin
      .from('calendar_events')
      .select('*')
      .eq('regional', 'centro_oeste');

    if (centroOesteEventsError) {
      console.error('❌ Erro ao buscar eventos centro-oeste:', centroOesteEventsError);
    } else {
      console.log('📊 Eventos encontrados para centro_oeste:', centroOesteEvents.length);
      if (centroOesteEvents.length > 0) {
        console.log('📋 Primeiro evento:', {
          id: centroOesteEvents[0].id,
          title: centroOesteEvents[0].title,
          regional: centroOesteEvents[0].regional,
          start_date: centroOesteEvents[0].start_date
        });
      }
    }

    // 6. Verificar se existem dados com outras variações de centro-oeste
    console.log('\n6️⃣ Verificando variações de centro-oeste...');
    const variations = ['Centro-Oeste', 'centro-oeste', 'CENTRO_OESTE', 'Centro Oeste'];
    
    for (const variation of variations) {
      const { data: variationActivities } = await supabaseAdmin
        .from('regional_activities')
        .select('id, titulo, regional')
        .eq('regional', variation);
      
      if (variationActivities && variationActivities.length > 0) {
        console.log(`📊 Encontradas ${variationActivities.length} atividades com regional "${variation}"`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugRegionalMapping().then(() => {
  console.log('\n🎯 Debug concluído!');
});