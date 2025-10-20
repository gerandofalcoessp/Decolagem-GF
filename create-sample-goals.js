require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSampleGoals() {
  console.log('🎯 Criando metas de exemplo...\n');

  try {
    // 1. Buscar um usuário existente para associar as metas
    console.log('1. Buscando usuário para associar as metas...');
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, email')
      .limit(1);

    if (membersError) {
      console.error('❌ Erro ao buscar members:', membersError.message);
      return;
    }

    let memberId;
    if (!members || members.length === 0) {
      console.log('📝 Nenhum member encontrado. Criando um member de exemplo...');
      
      const { data: newMember, error: createMemberError } = await supabase
        .from('members')
        .insert({
          name: 'Usuário Exemplo Metas',
          email: 'metas@exemplo.com'
        })
        .select('id')
        .single();

      if (createMemberError) {
        console.error('❌ Erro ao criar member:', createMemberError.message);
        return;
      }

      memberId = newMember.id;
      console.log(`✅ Member criado com ID: ${memberId}`);
    } else {
      memberId = members[0].id;
      console.log(`✅ Usando member existente: ${members[0].name} (ID: ${memberId})`);
    }

    // 2. Criar metas de exemplo
    console.log('\n2. Criando metas de exemplo...');
    
    const sampleGoals = [
      {
        nome: 'Famílias Embarcadas Decolagem - SP',
        descricao: 'Meta de famílias embarcadas no programa Decolagem para a regional São Paulo',
        valor_meta: 500,
        valor_atual: 250,
        due_date: '2024-12-31',
        status: 'in_progress',
        member_id: memberId
      },
      {
        nome: 'Famílias Embarcadas Decolagem - RJ',
        descricao: 'Meta de famílias embarcadas no programa Decolagem para a regional Rio de Janeiro',
        valor_meta: 300,
        valor_atual: 150,
        due_date: '2024-12-31',
        status: 'in_progress',
        member_id: memberId
      },
      {
        nome: 'Famílias Embarcadas Decolagem - Nordeste',
        descricao: 'Meta de famílias embarcadas no programa Decolagem para a regional Nordeste',
        valor_meta: 400,
        valor_atual: 200,
        due_date: '2024-12-31',
        status: 'in_progress',
        member_id: memberId
      },
      {
        nome: 'Atendidos Diretamente - Nacional',
        descricao: 'Meta nacional de pessoas atendidas diretamente pelos programas',
        valor_meta: 1000,
        valor_atual: 450,
        due_date: '2024-12-31',
        status: 'in_progress',
        member_id: memberId
      },
      {
        nome: 'Capacitações Realizadas - Sul',
        descricao: 'Meta de capacitações realizadas na regional Sul',
        valor_meta: 50,
        valor_atual: 25,
        due_date: '2024-12-31',
        status: 'in_progress',
        member_id: memberId
      }
    ];

    // Inserir as metas
    const { data: insertedGoals, error: goalsError } = await supabase
      .from('goals')
      .insert(sampleGoals)
      .select('*');

    if (goalsError) {
      console.error('❌ Erro ao inserir metas:', goalsError.message);
      return;
    }

    console.log(`✅ ${insertedGoals.length} metas criadas com sucesso!`);

    // 3. Mostrar as metas criadas
    console.log('\n📊 Metas criadas:');
    insertedGoals.forEach((goal, index) => {
      console.log(`\n${index + 1}. ${goal.nome}`);
      console.log(`   Tipo: ${goal.tipo}`);
      console.log(`   Regional: ${goal.regional}`);
      console.log(`   Meta: ${goal.valor_meta}`);
      console.log(`   Atual: ${goal.valor_atual}`);
      console.log(`   Status: ${goal.status}`);
      console.log(`   ID: ${goal.id}`);
    });

    // 4. Verificar total de metas na tabela
    console.log('\n4. Verificando total de metas na tabela...');
    const { count: totalGoals } = await supabase
      .from('goals')
      .select('*', { count: 'exact', head: true });

    console.log(`📈 Total de metas na tabela goals: ${totalGoals}`);

    console.log('\n🎉 Processo concluído com sucesso!');
    console.log('💡 Agora você pode testar a API de metas e verificar se aparecem no frontend.');

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar o script
createSampleGoals();