const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSPUsers() {
  try {
    console.log('🔍 Verificando usuários da Regional SP...');
    
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }
    
    console.log('📊 Total de usuários encontrados:', users.length);
    console.log('');
    
    // Filtrar usuários que podem ser da Regional SP
    const spUsers = users.filter(user => {
      const regional = (user.regional || '').toLowerCase();
      const area = (user.area || '').toLowerCase();
      const userMetadata = user.user_metadata || {};
      const metadataRegional = (userMetadata.regional || '').toLowerCase();
      
      return regional.includes('sp') || 
             regional.includes('são paulo') || 
             regional.includes('sao paulo') ||
             area.includes('sp') ||
             area.includes('são paulo') ||
             area.includes('sao paulo') ||
             metadataRegional.includes('sp') ||
             metadataRegional.includes('são paulo') ||
             metadataRegional.includes('sao paulo');
    });
    
    console.log('🏢 Usuários da Regional SP encontrados:', spUsers.length);
    
    if (spUsers.length > 0) {
      spUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nome || user.email}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Regional: ${user.regional || 'N/A'}`);
        console.log(`   Area: ${user.area || 'N/A'}`);
        console.log(`   Função: ${user.funcao || 'N/A'}`);
        console.log(`   Status: ${user.status || 'N/A'}`);
        if (user.user_metadata && user.user_metadata.regional) {
          console.log(`   Metadata Regional: ${user.user_metadata.regional}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ Nenhum usuário da Regional SP encontrado');
      console.log('');
      console.log('📋 Todas as regionais encontradas:');
      const regionais = [...new Set(users.map(u => u.regional).filter(Boolean))];
      regionais.forEach(r => console.log(`   - ${r}`));
      console.log('');
      console.log('📋 Todas as áreas encontradas:');
      const areas = [...new Set(users.map(u => u.area).filter(Boolean))];
      areas.forEach(a => console.log(`   - ${a}`));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkSPUsers();