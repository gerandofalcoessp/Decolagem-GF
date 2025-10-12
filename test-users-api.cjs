const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUsersAPI() {
  try {
    console.log('🔍 Testando carregamento de usuários pela API...');
    
    // Simular a query que o frontend faz
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome');

    if (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      return;
    }

    console.log(`✅ Total de usuários carregados: ${users.length}`);
    
    // Filtrar usuários Centro-Oeste
    const centroOesteUsers = users.filter(user => {
      const regional = user.regional || user.area || '';
      return regional.toLowerCase().includes('centro');
    });

    console.log(`🎯 Usuários Centro-Oeste encontrados: ${centroOesteUsers.length}`);
    
    if (centroOesteUsers.length > 0) {
      console.log('📋 Detalhes dos usuários Centro-Oeste:');
      centroOesteUsers.forEach(user => {
        console.log(`  - ID: ${user.id}`);
        console.log(`    Nome: ${user.nome || user.email}`);
        console.log(`    Regional: ${user.regional}`);
        console.log(`    Área: ${user.area}`);
        console.log(`    User Metadata: ${JSON.stringify(user.user_metadata)}`);
        console.log('    ---');
      });
    }

    // Verificar todas as regionais disponíveis
    const regionais = [...new Set(users.map(u => u.regional || u.area).filter(Boolean))];
    console.log('🗺️ Todas as regionais encontradas:', regionais.sort());

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testUsersAPI();