require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugGoalsDatabase() {
  console.log('🔍 Verificando metas diretamente no banco de dados...\n');

  try {
    // 1. Verificar se a tabela goals existe e tem dados
    console.log('1. Verificando tabela goals...');
    const { data: goals, error: goalsError, count } = await supabase
      .from('goals')
      .select('*', { count: 'exact' });

    if (goalsError) {
      console.error('❌ Erro ao acessar tabela goals:', goalsError.message);
      return;
    }

    console.log(`✅ Tabela goals acessível! Total de registros: ${count}`);
    
    if (goals && goals.length > 0) {
      console.log('\n📊 Primeiras 5 metas encontradas:');
      goals.slice(0, 5).forEach((goal, index) => {
        console.log(`\n${index + 1}. Meta ID: ${goal.id}`);
        console.log(`   Nome: ${goal.nome || goal.title || 'N/A'}`);
        console.log(`   Descrição: ${goal.descricao || goal.description || 'N/A'}`);
        console.log(`   Tipo: ${goal.tipo || 'N/A'}`);
        console.log(`   Regional: ${goal.regional || 'N/A'}`);
        console.log(`   Meta: ${goal.meta || goal.valor_meta || 'N/A'}`);
        console.log(`   Atual: ${goal.atual || goal.valor_atual || 'N/A'}`);
        console.log(`   Status: ${goal.status || 'N/A'}`);
        console.log(`   Member ID: ${goal.member_id || 'N/A'}`);
        console.log(`   Ano: ${goal.ano || 'N/A'}`);
        console.log(`   Mês: ${goal.mes || 'N/A'}`);
        console.log(`   Criado em: ${goal.created_at || 'N/A'}`);
      });

      // 2. Verificar metas por tipo
      console.log('\n2. Verificando metas por tipo...');
      const tiposUnicos = [...new Set(goals.map(g => g.tipo).filter(Boolean))];
      console.log('Tipos de metas encontrados:', tiposUnicos);

      // 3. Verificar metas relacionadas a "Famílias Embarcadas"
      console.log('\n3. Procurando metas relacionadas a "Famílias Embarcadas"...');
      const familiesGoals = goals.filter(goal => 
        (goal.tipo && goal.tipo.toLowerCase().includes('familia')) ||
        (goal.nome && goal.nome.toLowerCase().includes('família')) ||
        (goal.title && goal.title.toLowerCase().includes('família')) ||
        (goal.descricao && goal.descricao.toLowerCase().includes('família')) ||
        (goal.description && goal.description.toLowerCase().includes('família'))
      );

      if (familiesGoals.length > 0) {
        console.log(`✅ Encontradas ${familiesGoals.length} metas relacionadas a famílias:`);
        familiesGoals.forEach((goal, index) => {
          console.log(`${index + 1}. ${goal.nome || goal.title} (Tipo: ${goal.tipo})`);
        });
      } else {
        console.log('⚠️ Nenhuma meta relacionada a famílias encontrada');
      }

      // 4. Verificar estrutura dos campos
      console.log('\n4. Analisando estrutura dos campos...');
      const firstGoal = goals[0];
      console.log('Campos disponíveis na primeira meta:');
      Object.keys(firstGoal).forEach(key => {
        console.log(`   - ${key}: ${typeof firstGoal[key]} (${firstGoal[key]})`);
      });

    } else {
      console.log('⚠️ Nenhuma meta encontrada na tabela goals!');
    }

    // 5. Verificar usuários e suas metas
    console.log('\n5. Verificando usuários com metas...');
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, nome, email');

    if (membersError) {
      console.error('❌ Erro ao buscar members:', membersError.message);
    } else if (members && members.length > 0) {
      console.log(`✅ Encontrados ${members.length} membros`);
      
      // Verificar quantas metas cada membro tem
      for (const member of members.slice(0, 3)) { // Apenas os primeiros 3 para não sobrecarregar
        const { data: memberGoals, count: memberGoalsCount } = await supabase
          .from('goals')
          .select('*', { count: 'exact' })
          .eq('member_id', member.id);

        console.log(`   ${member.nome} (${member.email}): ${memberGoalsCount || 0} metas`);
      }
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar o debug
debugGoalsDatabase();