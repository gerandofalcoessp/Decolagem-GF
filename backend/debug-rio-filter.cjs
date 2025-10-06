const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugRioFilter() {
  try {
    console.log('🔍 Testando filtro de usuários para Rio de Janeiro...\n');
    
    // Simular o normalize function do frontend
    const normalize = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // REGIONAL_ALIASES atualizado
    const REGIONAL_ALIASES = {
      nacional: ['nacional'],
      centroeste: ['centroeste', 'centro-oeste', 'centrooeste'],
      nordeste: ['nordeste'],
      nordeste_2: ['nordeste2', 'nordeste 2', 'nordeste_2', 'r.nordeste2', 'r. nordeste 2', 'r.nordeste 2'],
      norte: ['norte'],
      rj: ['rj', 'riodejaneiro', 'rio de janeiro', 'r. rio de janeiro', 'r.rio de janeiro'],
      sp: ['sp', 'saopaulo'],
      sul: ['sul'],
    };
    
    // Buscar usuário do Rio de Janeiro
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar auth.users:', authError);
      return;
    }
    
    const rioUser = authUsers.users.find(user => 
      user.user_metadata?.regional === 'R. Rio de Janeiro'
    );
    
    if (!rioUser) {
      console.log('❌ Usuário do Rio de Janeiro não encontrado');
      return;
    }
    
    console.log('👤 Usuário encontrado:');
    console.log(`   - Email: ${rioUser.email}`);
    console.log(`   - Regional: "${rioUser.user_metadata?.regional}"`);
    console.log(`   - Nome: "${rioUser.user_metadata?.nome || rioUser.user_metadata?.name}"`);
    
    // Simular o filtro do frontend para regional 'rj'
    const userRegional = rioUser.user_metadata?.regional || '';
    const aff = normalize(userRegional);
    
    console.log(`\n🔍 Testando filtro para regional 'rj':`);
    console.log(`   - userRegional original: "${userRegional}"`);
    console.log(`   - userRegional normalizado: "${aff}"`);
    
    const matchers = REGIONAL_ALIASES['rj'] || [];
    console.log(`   - Matchers para 'rj': [${matchers.map(m => `"${m}"`).join(', ')}]`);
    
    const byRegional = matchers.some((m) => aff.includes(m));
    console.log(`   - Resultado do filtro: ${byRegional ? '✅ PASSOU' : '❌ NÃO PASSOU'}`);
    
    // Testar cada matcher individualmente
    console.log('\n🔍 Testando cada matcher individualmente:');
    matchers.forEach(matcher => {
      const matches = aff.includes(matcher);
      console.log(`   - "${matcher}": ${matches ? '✅' : '❌'}`);
    });
    
    // Buscar dados do usuário na tabela usuarios
    console.log('\n📊 Verificando dados na tabela usuarios:');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', rioUser.email);
    
    if (usuariosError) {
      console.error('❌ Erro ao buscar usuarios:', usuariosError);
    } else if (usuarios.length > 0) {
      const usuario = usuarios[0];
      console.log(`   - Email: ${usuario.email}`);
      console.log(`   - Regional: "${usuario.regional}"`);
      console.log(`   - Função: "${usuario.funcao}"`);
      console.log(`   - Ativo: ${usuario.ativo}`);
    } else {
      console.log('❌ Usuário não encontrado na tabela usuarios');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugRioFilter();