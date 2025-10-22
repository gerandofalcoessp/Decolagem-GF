const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createTestData() {
  console.log('🧪 Criando dados de teste...\n');

  try {
    // Usar service role key para ter permissões administrativas
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Verificar se já existem members
    console.log('1. 🔍 Verificando members existentes...');
    const { data: existingMembers, error: membersError } = await supabase
      .from('members')
      .select('*')
      .limit(5);

    if (membersError) {
      console.error('❌ Erro ao buscar members:', membersError.message);
    } else {
      console.log(`✅ Encontrados ${existingMembers.length} members:`);
      existingMembers.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.nome} (ID: ${member.id})`);
      });
    }

    // 2. Verificar se já existem atividades regionais
    console.log('\n2. 🔍 Verificando atividades regionais existentes...');
    const { data: existingActivities, error: activitiesError } = await supabase
      .from('regional_activities')
      .select('*')
      .limit(5);

    if (activitiesError) {
      console.error('❌ Erro ao buscar atividades:', activitiesError.message);
    } else {
      console.log(`✅ Encontradas ${existingActivities.length} atividades regionais:`);
      existingActivities.forEach((activity, index) => {
        console.log(`   ${index + 1}. ${activity.title} (ID: ${activity.id})`);
      });
    }

    // 3. Se não há members, criar um member de teste
    let testMemberId = null;
    if (!existingMembers || existingMembers.length === 0) {
      console.log('\n3. 👤 Criando member de teste...');
      
      // Primeiro, verificar se existe um usuário auth válido
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Erro ao buscar usuários auth:', authError.message);
        return;
      }

      const testAuthUser = authUsers.users.find(u => u.email === 'flavio.almeida@gerandofalcoes.com');
      
      if (!testAuthUser) {
        console.error('❌ Usuário auth não encontrado');
        return;
      }

      const testMember = {
        auth_user_id: testAuthUser.id,
        nome: 'Flavio Almeida (Teste)',
        email: 'flavio.almeida@gerandofalcoes.com',
        regional: 'SP',
        funcao: 'super_admin',
        status: 'ativo'
      };

      const { data: newMember, error: createMemberError } = await supabase
        .from('members')
        .insert(testMember)
        .select()
        .single();

      if (createMemberError) {
        console.error('❌ Erro ao criar member:', createMemberError.message);
        return;
      }

      console.log('✅ Member de teste criado:', newMember.nome);
      testMemberId = newMember.id;
    } else {
      testMemberId = existingMembers[0].id;
      console.log(`\n3. ✅ Usando member existente: ${existingMembers[0].nome}`);
    }

    // 4. Se não há atividades, criar algumas atividades de teste
    if (!existingActivities || existingActivities.length === 0) {
      console.log('\n4. 📝 Criando atividades de teste...');
      
      const testActivities = [
        {
          member_id: testMemberId,
          title: 'Capacitação de Líderes - Teste',
          description: 'Treinamento para novos líderes comunitários (dados de teste)',
          activity_date: '2024-01-20',
          type: 'capacitacao',
          regional: 'SP',
          status: 'ativo'
        },
        {
          member_id: testMemberId,
          title: 'Workshop de Empreendedorismo - Teste',
          description: 'Oficina sobre desenvolvimento de pequenos negócios (dados de teste)',
          activity_date: '2024-02-01',
          type: 'workshop',
          regional: 'SP',
          status: 'ativo'
        },
        {
          member_id: testMemberId,
          title: 'Visita às Famílias - Teste',
          description: 'Visita domiciliar para acompanhamento das famílias (dados de teste)',
          activity_date: '2024-01-25',
          type: 'visita',
          regional: 'SP',
          status: 'ativo'
        }
      ];

      const { data: newActivities, error: createActivitiesError } = await supabase
        .from('regional_activities')
        .insert(testActivities)
        .select();

      if (createActivitiesError) {
        console.error('❌ Erro ao criar atividades:', createActivitiesError.message);
        return;
      }

      console.log(`✅ ${newActivities.length} atividades de teste criadas:`);
      newActivities.forEach((activity, index) => {
        console.log(`   ${index + 1}. ${activity.title} (ID: ${activity.id})`);
      });
    } else {
      console.log('\n4. ✅ Atividades já existem, não é necessário criar');
    }

    // 5. Listar dados finais
    console.log('\n5. 📊 Resumo dos dados disponíveis:');
    
    const { data: finalMembers } = await supabase
      .from('members')
      .select('*');
    
    const { data: finalActivities } = await supabase
      .from('regional_activities')
      .select('*');

    console.log(`   Members: ${finalMembers ? finalMembers.length : 0}`);
    console.log(`   Atividades Regionais: ${finalActivities ? finalActivities.length : 0}`);

    if (finalActivities && finalActivities.length > 0) {
      console.log('\n📋 Primeira atividade disponível para teste:');
      const firstActivity = finalActivities[0];
      console.log(`   ID: ${firstActivity.id}`);
      console.log(`   Título: ${firstActivity.title}`);
      console.log(`   Tipo: ${firstActivity.type}`);
      console.log(`   Regional: ${firstActivity.regional}`);
      console.log(`   URL de teste: http://localhost:4000/api/regional-activities/${firstActivity.id}/with-files`);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

createTestData();