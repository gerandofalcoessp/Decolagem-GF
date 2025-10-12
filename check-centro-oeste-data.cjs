const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ixqjqhqxqhqxqhqx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHF4cWhxeHFocXgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzU1MzIwMCwiZXhwIjoyMDUzMTI5MjAwfQ.abc123';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCentroOesteData() {
  try {
    console.log('🔍 Verificando dados da região Centro-oeste...\n');
    
    // 1. Verificar atividades regionais
    console.log('📊 1. Verificando regional_activities...');
    const { data: regionalActivities, error: regError } = await supabase
      .from('regional_activities')
      .select('*')
      .or('regional.ilike.%centro%,regional.ilike.%oeste%,regional.eq.Centro-Oeste')
      .eq('status', 'ativo')
      .order('data_atividade', { ascending: false });
    
    if (regError) {
      console.error('❌ Erro ao buscar regional_activities:', regError);
    } else {
      console.log(`   ✅ Encontradas ${regionalActivities?.length || 0} atividades regionais`);
      if (regionalActivities && regionalActivities.length > 0) {
        regionalActivities.forEach((atividade, index) => {
          console.log(`   ${index + 1}. ${atividade.atividade_label} - Regional: ${atividade.regional} - Qtd: ${atividade.quantidade}`);
        });
      }
    }
    
    // 2. Verificar metas/goals
    console.log('\n📊 2. Verificando goals/metas...');
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .or('regional.ilike.%centro%,regional.ilike.%oeste%,regional.eq.Centro-Oeste')
      .order('created_at', { ascending: false });
    
    if (goalsError) {
      console.error('❌ Erro ao buscar goals:', goalsError);
    } else {
      console.log(`   ✅ Encontradas ${goals?.length || 0} metas`);
      if (goals && goals.length > 0) {
        goals.forEach((goal, index) => {
          console.log(`   ${index + 1}. ${goal.titulo || goal.nome} - Regional: ${goal.regional} - Status: ${goal.status}`);
        });
      }
    }
    
    // 3. Verificar usuários da região Centro-oeste
    console.log('\n👥 3. Verificando usuários...');
    const { data: users, error: usersError } = await supabase
      .from('usuarios')
      .select('*')
      .or('regional.ilike.%centro%,regional.ilike.%oeste%,area.ilike.%centro%,area.ilike.%oeste%')
      .eq('status', 'ativo');
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
    } else {
      console.log(`   ✅ Encontrados ${users?.length || 0} usuários`);
      if (users && users.length > 0) {
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.nome || user.email} - Regional: ${user.regional || user.area}`);
        });
      }
    }
    
    // 4. Verificar todas as regionais disponíveis
    console.log('\n🗺️  4. Verificando todas as regionais disponíveis...');
    const { data: allRegionals, error: allRegError } = await supabase
      .from('regional_activities')
      .select('regional')
      .eq('status', 'ativo');
    
    if (!allRegError && allRegionals) {
      const regionaisUnicas = [...new Set(allRegionals.map(a => a.regional))].sort();
      console.log('   📍 Regionais encontradas:');
      regionaisUnicas.forEach(regional => {
        console.log(`      • ${regional}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Verificação concluída!');
    
  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

checkCentroOesteData();