const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugUsersRegional() {
  try {
    console.log('🔍 Investigando usuários e suas regionais...');
    
    // Buscar todos os usuários
    const { data: users, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }
    
    console.log('📊 Total de usuários encontrados:', users.length);
    console.log('');
    
    // Agrupar por regional
    const regionalGroups = {};
    
    users.forEach((user, index) => {
      const regional = user.regional || 'Sem Regional';
      
      if (!regionalGroups[regional]) {
        regionalGroups[regional] = [];
      }
      
      regionalGroups[regional].push({
        nome: user.nome,
        email: user.email,
        funcao: user.funcao,
        role: user.role,
        area: user.area
      });
    });
    
    console.log('👥 Usuários agrupados por regional:');
    console.log('');
    
    Object.keys(regionalGroups).sort().forEach(regional => {
      console.log(`🏢 Regional: ${regional}`);
      console.log(`   Total: ${regionalGroups[regional].length} usuários`);
      
      regionalGroups[regional].forEach(user => {
        console.log(`   - ${user.nome || user.email}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Função: ${user.funcao || 'N/A'}`);
        console.log(`     Role: ${user.role || 'N/A'}`);
        console.log(`     Area: ${user.area || 'N/A'}`);
        console.log('');
      });
      
      console.log('');
    });
    
    // Verificar especificamente usuários de Nordeste 2
    console.log('🔍 Foco em usuários de Nordeste 2:');
    const nordeste2Users = users.filter(u => 
      u.regional && (
        u.regional.toLowerCase().includes('nordeste 2') ||
        u.regional.toLowerCase().includes('nordeste_2') ||
        u.regional.toLowerCase() === 'r. nordeste 2'
      )
    );
    
    console.log(`📊 Usuários de Nordeste 2 encontrados: ${nordeste2Users.length}`);
    nordeste2Users.forEach(user => {
      console.log(`   - ${user.nome || user.email}`);
      console.log(`     Regional: "${user.regional}"`);
      console.log(`     Area: "${user.area || 'N/A'}"`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugUsersRegional();