const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simular a função normalize do frontend
const normalize = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const REGIONAL_ALIASES = {
  nacional: ['nacional'],
  centroeste: ['centroeste', 'centro-oeste', 'centrooeste'],
  nordeste: ['nordeste'],
  nordeste_2: ['nordeste2', 'nordeste 2', 'nordeste_2', 'r.nordeste2', 'r. nordeste 2', 'r.nordeste 2'],
  norte: ['norte'],
  rj: ['rj', 'riodejaneiro'],
  sp: ['sp', 'saopaulo'],
  sul: ['sul'],
};

async function debugUserFilter() {
  try {
    console.log('🔍 Testando filtro de usuários para Nordeste 2...');
    
    // Buscar todos os usuários da tabela usuarios
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }
    
    console.log('📊 Total de usuários encontrados:', usuarios.length);
    console.log('');
    
    // Simular o filtro do frontend para nordeste_2
    const formRegional = 'nordeste_2';
    
    console.log(`🎯 Filtrando usuários para regional: ${formRegional}`);
    console.log('');
    
    const filteredUsers = usuarios.filter((u) => {
      // Usar tanto area quanto regional do usuário
      const userRegional = u.regional || u.area || '';
      const aff = normalize(userRegional);
      
      // Mapear a regional do form para as aliases corretas
      let regionalKey = formRegional;
      if (formRegional === 'nordeste_2') {
        regionalKey = 'nordeste_2';
      }
      
      const matchers = REGIONAL_ALIASES[regionalKey] || [];
      const byRegional = matchers.some((m) => aff.includes(m));
      const isNational = aff === 'nacional';
      
      console.log(`👤 Usuário: ${u.nome || u.email}`);
      console.log(`   Regional original: "${userRegional}"`);
      console.log(`   Regional normalizada: "${aff}"`);
      console.log(`   Matchers: [${matchers.join(', ')}]`);
      console.log(`   Passou no filtro: ${byRegional}`);
      console.log('');
      
      // Para outras regionais, mostrar apenas usuários da regional específica
      return byRegional;
    });
    
    console.log(`✅ Usuários filtrados para ${formRegional}: ${filteredUsers.length}`);
    
    if (filteredUsers.length > 0) {
      console.log('📋 Usuários que passaram no filtro:');
      filteredUsers.forEach(user => {
        console.log(`   - ${user.nome || user.email}`);
        console.log(`     Regional: "${user.regional}"`);
        console.log(`     Area: "${user.area}"`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum usuário passou no filtro');
    }
    
    // Verificar especificamente o usuário Eduardo Souza
    console.log('🔍 Verificando especificamente o usuário Eduardo Souza...');
    const eduardoUser = usuarios.find(u => 
      u.email === 'eduardo.neto@gerandofalcoes.com' || 
      (u.nome && u.nome.toLowerCase().includes('eduardo'))
    );
    
    if (eduardoUser) {
      console.log('👤 Eduardo encontrado:');
      console.log(`   Nome: ${eduardoUser.nome}`);
      console.log(`   Email: ${eduardoUser.email}`);
      console.log(`   Regional: "${eduardoUser.regional}"`);
      console.log(`   Area: "${eduardoUser.area}"`);
      
      const userRegional = eduardoUser.regional || eduardoUser.area || '';
      const aff = normalize(userRegional);
      const matchers = REGIONAL_ALIASES['nordeste_2'] || [];
      const byRegional = matchers.some((m) => aff.includes(m));
      
      console.log(`   Regional normalizada: "${aff}"`);
      console.log(`   Passou no filtro nordeste_2: ${byRegional}`);
    } else {
      console.log('❌ Eduardo não encontrado na tabela usuarios');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugUserFilter();