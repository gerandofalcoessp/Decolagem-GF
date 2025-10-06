const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Função para normalizar regional (mesma lógica do backend)
function normalizeRegional(regional) {
  return regional.toLowerCase()
    .replace(/^r\.\s*/, '') // Remove "R. " do início
    .replace(/\s+/g, '_')   // Substitui espaços por underscore
    .replace(/-/g, '_');    // Substitui hífens por underscore
}

async function testRegionalFilter() {
  try {
    console.log('🧪 Testando filtro regional...\n');
    
    // 1. Buscar todos os usuários e suas regionais
    const { data: usuarios, error: userError } = await supabase
      .from('usuarios')
      .select('id, nome, email, regional')
      .order('regional');
    
    if (userError) {
      console.error('❌ Erro ao buscar usuários:', userError);
      return;
    }
    
    console.log('👥 Usuários por regional:');
    usuarios.forEach((user, index) => {
      const normalized = normalizeRegional(user.regional || '');
      console.log(`${index + 1}. ${user.nome} (${user.email})`);
      console.log(`   - Regional original: "${user.regional}"`);
      console.log(`   - Regional normalizada: "${normalized}"`);
      console.log('');
    });
    
    // 2. Buscar todos os eventos
    const { data: eventos, error: eventError } = await supabase
      .from('calendar_events')
      .select('*')
      .order('created_at');
    
    if (eventError) {
      console.error('❌ Erro ao buscar eventos:', eventError);
      return;
    }
    
    console.log('📅 Eventos no banco:');
    eventos.forEach((event, index) => {
      console.log(`${index + 1}. ${event.titulo}`);
      console.log(`   - Regional: "${event.regional}"`);
      console.log(`   - Responsável ID: ${event.responsavel_id}`);
      console.log('');
    });
    
    // 3. Testar filtro para cada usuário
    console.log('🔍 Testando filtro para cada usuário:\n');
    
    for (const user of usuarios) {
      if (!user.regional) continue;
      
      const normalizedUserRegional = normalizeRegional(user.regional);
      
      console.log(`👤 Usuário: ${user.nome} (${user.regional})`);
      console.log(`🔧 Regional normalizada: "${normalizedUserRegional}"`);
      
      // Simular o filtro do backend
      const eventosParaEsteUsuario = eventos.filter(event => 
        event.regional === normalizedUserRegional
      );
      
      console.log(`📊 Eventos que este usuário deveria ver: ${eventosParaEsteUsuario.length}`);
      
      if (eventosParaEsteUsuario.length > 0) {
        eventosParaEsteUsuario.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.titulo} (regional: "${event.regional}")`);
        });
      } else {
        console.log('   ❌ Nenhum evento encontrado para esta regional');
      }
      
      console.log('');
    }
    
    // 4. Verificar se há incompatibilidades
    console.log('⚠️  Verificando incompatibilidades:\n');
    
    const regionaisUsuarios = [...new Set(usuarios.map(u => normalizeRegional(u.regional || '')))];
    const regionaisEventos = [...new Set(eventos.map(e => e.regional))];
    
    console.log('🏢 Regionais dos usuários (normalizadas):');
    regionaisUsuarios.forEach((regional, index) => {
      console.log(`${index + 1}. "${regional}"`);
    });
    
    console.log('\n📅 Regionais dos eventos:');
    regionaisEventos.forEach((regional, index) => {
      console.log(`${index + 1}. "${regional}"`);
    });
    
    console.log('\n🔍 Análise de compatibilidade:');
    regionaisEventos.forEach(eventRegional => {
      const temUsuarioCompativel = regionaisUsuarios.includes(eventRegional);
      console.log(`- Evento regional "${eventRegional}": ${temUsuarioCompativel ? '✅ Tem usuários compatíveis' : '❌ Sem usuários compatíveis'}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testRegionalFilter();