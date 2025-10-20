// Script para testar login no frontend e verificar carregamento de metas
const API_BASE_URL = 'http://localhost:4000';

async function testFrontendLogin() {
  console.log('🔍 Testando login no frontend e carregamento de metas...\n');

  try {
    // 1. Fazer login
    console.log('1. Fazendo login...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'flavio.almeida@gerandofalcoes.com',
        password: '123456'
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(`Erro no login: ${errorData.error || loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login realizado com sucesso');
    console.log('📋 Dados do login:', loginData);

    const token = loginData.session?.access_token || loginData.token;
    if (!token) {
      throw new Error('Token não encontrado na resposta do login');
    }
    console.log('🔑 Token obtido:', token.substring(0, 50) + '...');

    // 2. Testar API de metas
    console.log('\n2. Testando API de metas...');
    const goalsResponse = await fetch(`${API_BASE_URL}/api/goals`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!goalsResponse.ok) {
      const errorData = await goalsResponse.json();
      throw new Error(`Erro na API de metas: ${errorData.error || goalsResponse.statusText}`);
    }

    const goalsData = await goalsResponse.json();
    console.log('✅ API de metas respondeu com sucesso');
    console.log('📋 Estrutura da resposta:', Object.keys(goalsData));
    console.log('📊 Número de metas:', goalsData.data ? goalsData.data.length : 'N/A');

    if (goalsData.data && goalsData.data.length > 0) {
      console.log('\n📋 Primeira meta:');
      const firstGoal = goalsData.data[0];
      console.log('  - ID:', firstGoal.id);
      console.log('  - Nome:', firstGoal.nome);
      console.log('  - Status:', firstGoal.status);
      console.log('  - Valor Meta:', firstGoal.valor_meta);
      console.log('  - Valor Atual:', firstGoal.valor_atual);
      console.log('  - Member ID:', firstGoal.member_id);
      console.log('  - Due Date:', firstGoal.due_date);
    }

    // 3. Simular o processamento do GoalService
    console.log('\n3. Simulando processamento do GoalService...');
    
    if (goalsData.data && goalsData.data.length > 0) {
      const processedGoals = goalsData.data.map(goal => {
        // Simular a função adaptGoalToFrontend do goalService.ts
        let mes = ['todo-ano'];
        let regionais = ['SP'];
        let ano = new Date().getFullYear().toString();
        
        if (goal.due_date) {
          const dueDate = new Date(goal.due_date);
          ano = dueDate.getFullYear().toString();
          mes = [(dueDate.getMonth() + 1).toString().padStart(2, '0')];
        }
        
        // Extrair regionais da descrição
        if (goal.descricao) {
          const regionaisMatch = goal.descricao.match(/(?:regional|regionais|área|áreas):\s*([^|,\n]+)/i);
          if (regionaisMatch) {
            const regionaisStr = regionaisMatch[1].trim();
            console.log(`    Regionais extraídas de "${goal.nome}": "${regionaisStr}"`);
            
            if (regionaisStr.toLowerCase().includes('todas') || regionaisStr.toLowerCase().includes('nacional')) {
              regionais = ['nacional'];
            } else {
              const areasArray = regionaisStr.split(',').map(area => area.trim());
              regionais = areasArray.map(area => area.toLowerCase().trim());
            }
          }
        }

        return {
          id: goal.id,
          nome: goal.nome || 'Meta sem nome',
          descricao: goal.descricao,
          quantidade: goal.valor_meta?.toString() || '0',
          mes: mes,
          ano: ano,
          regionais: regionais,
          titulo: goal.nome || 'Meta sem nome',
          valorMeta: goal.valor_meta || 0,
          valorAtual: goal.valor_atual || 0,
          dataInicio: goal.created_at,
          dataFim: goal.due_date,
          status: goal.status === 'completed' ? 'concluida' : 
                  goal.status === 'in_progress' ? 'em_andamento' : 'pendente',
          equipe: 'Equipe Nacional',
          regional: regionais.join(', ')
        };
      });

      console.log('✅ Metas processadas para o frontend:');
      console.log(`📊 Total de metas processadas: ${processedGoals.length}`);
      
      processedGoals.forEach((goal, index) => {
        console.log(`\n📋 Meta ${index + 1}:`);
        console.log(`  - Nome: ${goal.nome}`);
        console.log(`  - Status: ${goal.status}`);
        console.log(`  - Regional: ${goal.regional}`);
        console.log(`  - Valor Meta: ${goal.valorMeta}`);
        console.log(`  - Valor Atual: ${goal.valorAtual}`);
      });
    }

    // 4. Testar se o token funciona para outras APIs
    console.log('\n4. Testando token com outras APIs...');
    
    const activitiesResponse = await fetch(`${API_BASE_URL}/api/regional-activities`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (activitiesResponse.ok) {
      const activitiesData = await activitiesResponse.json();
      console.log('✅ API de atividades regionais funcionando');
      console.log('📊 Número de atividades:', activitiesData.data ? activitiesData.data.length : 'N/A');
    } else {
      console.log('❌ API de atividades regionais falhou');
    }

    console.log('\n✅ Teste completo finalizado!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testFrontendLogin().catch(console.error);