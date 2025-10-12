const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCentroOesteUsers() {
  try {
    console.log('🔍 Verificando usuários da região Centro-Oeste...');
    
    // Primeiro, vamos verificar a estrutura da tabela usuarios
    const { data: tableInfo, error: tableError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erro ao verificar tabela usuarios:', tableError);
      return;
    }
    
    console.log('✅ Tabela usuarios encontrada');
    
    // Buscar usuários com regional = 'centro_oeste'
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, regional, area')
      .or('regional.eq.centro_oeste,regional.eq.centro-oeste,regional.eq.Centro-Oeste,area.eq.centro_oeste,area.eq.centro-oeste,area.eq.Centro-Oeste');
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }
    
    console.log(`📊 Total de usuários encontrados: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 Usuários da região Centro-Oeste:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nome} (${user.email})`);
        console.log(`   Regional: ${user.regional}`);
        console.log(`   Área: ${user.area}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum usuário encontrado para a região Centro-Oeste');
      
      // Vamos verificar todas as regionais disponíveis
      const { data: allUsers, error: allError } = await supabase
        .from('usuarios')
        .select('regional, area')
        .not('regional', 'is', null);
      
      if (!allError && allUsers.length > 0) {
        const regionais = [...new Set(allUsers.map(u => u.regional).filter(Boolean))];
        const areas = [...new Set(allUsers.map(u => u.area).filter(Boolean))];
        
        console.log('\n📋 Regionais disponíveis:', regionais);
        console.log('📋 Áreas disponíveis:', areas);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkCentroOesteUsers();