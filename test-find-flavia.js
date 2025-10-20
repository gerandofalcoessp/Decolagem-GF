const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findFlavia() {
  console.log('🔍 Procurando Flávia no banco de dados...\n');

  try {
    // 1. Buscar por diferentes variações do nome
    const searchTerms = [
      'flavia',
      'Flávia',
      'silva',
      'Silva',
      'flavia.silva',
      'decolagem'
    ];

    for (const term of searchTerms) {
      console.log(`🔍 Buscando por: "${term}"`);
      
      // Buscar no nome
      const { data: byName, error: nameError } = await supabase
        .from('members')
        .select('*')
        .ilike('nome', `%${term}%`);

      if (!nameError && byName.length > 0) {
        console.log(`   ✅ Encontrado ${byName.length} por nome:`);
        byName.forEach(member => {
          console.log(`      - ${member.nome} (${member.email}) - Regional: ${member.regional}`);
        });
      }

      // Buscar no email
      const { data: byEmail, error: emailError } = await supabase
        .from('members')
        .select('*')
        .ilike('email', `%${term}%`);

      if (!emailError && byEmail.length > 0) {
        console.log(`   ✅ Encontrado ${byEmail.length} por email:`);
        byEmail.forEach(member => {
          console.log(`      - ${member.nome} (${member.email}) - Regional: ${member.regional}`);
        });
      }
      
      console.log('');
    }

    // 2. Listar todos os membros com regional contendo "Rio"
    console.log('🌎 Membros com regional contendo "Rio":');
    const { data: rioMembers, error: rioError } = await supabase
      .from('members')
      .select('*')
      .ilike('regional', '%Rio%');

    if (rioError) {
      console.error('❌ Erro ao buscar membros do Rio:', rioError.message);
    } else {
      console.log(`   Encontrados: ${rioMembers.length}`);
      rioMembers.forEach(member => {
        console.log(`   - ${member.nome} (${member.email}) - Regional: ${member.regional}`);
      });
    }

    // 3. Listar alguns membros para ver a estrutura
    console.log('\n📋 Primeiros 10 membros (para ver estrutura):');
    const { data: allMembers, error: allError } = await supabase
      .from('members')
      .select('*')
      .limit(10);

    if (allError) {
      console.error('❌ Erro ao buscar membros:', allError.message);
    } else {
      allMembers.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.nome} (${member.email}) - Regional: ${member.regional} - Role: ${member.role}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro durante busca:', error);
  }
}

findFlavia().catch(console.error);