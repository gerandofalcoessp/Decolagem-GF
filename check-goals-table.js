const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkGoalsTable() {
  console.log('🔍 Verificando tabela goals...\n');

  try {
    // 1. Verificar se a tabela existe e sua estrutura
    console.log('1️⃣ Verificando estrutura da tabela goals...');
    const { data: sampleGoals, error: structureError } = await supabase
      .from('goals')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Erro ao acessar tabela goals:', structureError.message);
      return;
    }

    if (sampleGoals && sampleGoals.length > 0) {
      console.log('✅ Tabela goals existe');
      console.log('📊 Colunas disponíveis:', Object.keys(sampleGoals[0]));
      console.log('📝 Exemplo de registro:', sampleGoals[0]);
    } else {
      console.log('📋 Tabela goals existe mas está vazia');
    }

    // 2. Contar total de registros
    console.log('\n2️⃣ Contando registros na tabela goals...');
    const { count, error: countError } = await supabase
      .from('goals')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erro ao contar registros:', countError.message);
    } else {
      console.log(`📊 Total de registros na tabela goals: ${count}`);
    }

    // 3. Se houver registros, mostrar alguns exemplos
    if (count && count > 0) {
      console.log('\n3️⃣ Mostrando alguns registros de exemplo...');
      const { data: allGoals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .limit(10);

      if (goalsError) {
        console.error('❌ Erro ao buscar registros:', goalsError.message);
      } else {
        console.log(`📋 Primeiros ${allGoals.length} registros:`);
        allGoals.forEach((goal, index) => {
          console.log(`\n${index + 1}. Meta ID: ${goal.id}`);
          console.log(`   Nome: ${goal.nome || 'N/A'}`);
          console.log(`   Descrição: ${goal.descricao || 'N/A'}`);
          console.log(`   Member ID: ${goal.member_id || 'N/A'}`);
          console.log(`   Valor Meta: ${goal.valor_meta || 'N/A'}`);
          console.log(`   Valor Atual: ${goal.valor_atual || 'N/A'}`);
          console.log(`   Regional: ${goal.regional || 'N/A'}`);
          console.log(`   Área: ${goal.area || 'N/A'}`);
        });
      }

      // 4. Verificar se há metas relacionadas ao Rio de Janeiro
      console.log('\n4️⃣ Buscando metas relacionadas ao Rio de Janeiro...');
      const { data: rjGoals, error: rjError } = await supabase
        .from('goals')
        .select('*')
        .or('descricao.ilike.*Rio de Janeiro*,regional.ilike.*Rio de Janeiro*,area.ilike.*Rio de Janeiro*');

      if (rjError) {
        console.error('❌ Erro ao buscar metas do RJ:', rjError.message);
      } else {
        console.log(`🏙️ Metas relacionadas ao Rio de Janeiro: ${rjGoals.length}`);
        rjGoals.forEach((goal, index) => {
          console.log(`   ${index + 1}. ${goal.nome} - ${goal.descricao}`);
        });
      }
    }

    // 5. Verificar se há metas criadas pelos super admins identificados
    console.log('\n5️⃣ Verificando metas criadas por super admins...');
    const superAdminIds = [
      '3450ebb4-6e86-475a-9443-ed84369c5184', // Flávio Almeida
      '0e63b7c4-0e3c-4295-8443-cacce34ec1c3', // Erika Miranda
      '784f9d08-b86c-4a90-849a-817866ded138'  // Léo martins
    ];

    const { data: adminGoals, error: adminError } = await supabase
      .from('goals')
      .select('*')
      .in('member_id', superAdminIds);

    if (adminError) {
      console.error('❌ Erro ao buscar metas de super admins:', adminError.message);
    } else {
      console.log(`👑 Metas criadas por super admins: ${adminGoals.length}`);
      adminGoals.forEach((goal, index) => {
        console.log(`   ${index + 1}. ${goal.nome} - Member ID: ${goal.member_id}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

checkGoalsTable().catch(console.error);