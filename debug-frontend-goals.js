const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Simular o que o frontend faz
async function debugFrontendGoals() {
  console.log('🔍 Debugando carregamento de metas no frontend...\n');

  try {
    // 1. Fazer login como o frontend faria
    console.log('1. Fazendo login...');
    const loginResponse = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@decolagem.com',
        password: 'Teste123!'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      throw new Error(`Login falhou: ${loginData.error}`);
    }

    const token = loginData.token;
    console.log('✅ Login realizado com sucesso');

    // 2. Buscar metas como o frontend faria
    console.log('\n2. Buscando metas via API...');
    const goalsResponse = await fetch('http://localhost:4000/goals', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const goalsData = await goalsResponse.json();
    if (!goalsResponse.ok) {
      throw new Error(`Erro ao buscar metas: ${goalsData.error}`);
    }

    console.log('✅ Metas recebidas da API:');
    console.log(JSON.stringify(goalsData, null, 2));

    // 3. Simular o processamento do goalService.ts
    console.log('\n3. Simulando adaptação para o frontend...');
    const goals = goalsData.data || [];
    
    const adaptedGoals = goals.map(goal => {
      console.log(`\n📋 Processando meta: ${goal.nome}`);
      console.log(`   Campos originais:`, Object.keys(goal));
      
      // Simular a adaptação do goalService.ts
      const adapted = {
        id: goal.id,
        nome: goal.nome,
        descricao: goal.descricao,
        quantidade: goal.valor_meta?.toString() || '0',
        mes: goal.due_date ? (new Date(goal.due_date).getMonth() + 1).toString() : new Date().getMonth().toString(),
        ano: goal.due_date ? new Date(goal.due_date).getFullYear().toString() : new Date().getFullYear().toString(),
        regionais: [], // Vazio por padrão
        // Campos para DashboardMetasPage
        titulo: goal.nome,
        valorMeta: goal.valor_meta || 0,
        valorAtual: goal.valor_atual || 0,
        dataInicio: goal.created_at,
        dataFim: goal.due_date,
        status: goal.status === 'completed' ? 'concluida' : 
                goal.status === 'in_progress' ? 'em_andamento' : 'pendente',
        equipe: '', // Vazio por padrão
        regional: '', // Vazio por padrão
      };

      console.log(`   Campos adaptados:`, Object.keys(adapted));
      console.log(`   Status original: ${goal.status} -> Status adaptado: ${adapted.status}`);
      
      return adapted;
    });

    console.log('\n4. Metas adaptadas para o frontend:');
    console.log(JSON.stringify(adaptedGoals, null, 2));

    // 5. Simular o que o DashboardMetasPage faria
    console.log('\n5. Simulando processamento do DashboardMetasPage...');
    const totalMetas = adaptedGoals.length;
    const metasConcluidas = adaptedGoals.filter(meta => meta.status === 'concluida').length;
    const metasEmAndamento = adaptedGoals.filter(meta => meta.status === 'em_andamento').length;

    console.log(`   Total de metas: ${totalMetas}`);
    console.log(`   Metas concluídas: ${metasConcluidas}`);
    console.log(`   Metas em andamento: ${metasEmAndamento}`);

    // 6. Verificar se há problemas com filtros
    console.log('\n6. Verificando filtros...');
    const metasFiltradas = adaptedGoals.filter(meta => {
      const atividadeMatch = true; // Sem filtro de atividade
      const regionalMatch = true; // Filtro 'todos'
      const equipeMatch = true; // Filtro 'todos'
      
      if (!meta.dataInicio) return atividadeMatch && regionalMatch && equipeMatch;
      
      const date = new Date(meta.dataInicio);
      const mes = (date.getMonth() + 1).toString();
      const ano = date.getFullYear().toString();
      const mesMatch = true; // Filtro 'todos'
      const anoMatch = true; // Filtro 'todos'
      const mesAnoMatch = mesMatch && anoMatch;
      return atividadeMatch && regionalMatch && equipeMatch && mesAnoMatch;
    });

    console.log(`   Metas após filtros: ${metasFiltradas.length}`);

    if (metasFiltradas.length === 0) {
      console.log('⚠️  PROBLEMA: Nenhuma meta passou pelos filtros!');
    } else {
      console.log('✅ Metas passaram pelos filtros corretamente');
    }

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

debugFrontendGoals();