// Usando fetch nativo do Node.js (disponível a partir da versão 18)

async function debugFrontendAPI() {
  console.log('🔍 Debugando chamadas da API do frontend...\n');
  
  try {
    // 1. Fazer login
    console.log('1. Fazendo login...');
    const loginResponse = await fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@decolagem.com',
        password: '123456'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.session?.access_token;
    
    if (!token) {
      console.log('❌ Erro: Token não encontrado no login');
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    console.log(`🔑 Token: ${token.substring(0, 50)}...`);
    
    // 2. Testar chamada para /goals (como o frontend faria)
    console.log('\n2. Testando chamada /goals...');
    const goalsResponse = await fetch('http://localhost:3001/goals', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`   Status: ${goalsResponse.status}`);
    
    if (goalsResponse.ok) {
      const goalsData = await goalsResponse.json();
      console.log('✅ Dados das metas recebidos:');
      console.log(JSON.stringify(goalsData, null, 2));
      
      // 3. Simular processamento do frontend
      console.log('\n3. Simulando processamento do frontend...');
      
      if (goalsData.data && Array.isArray(goalsData.data)) {
        console.log(`   Número de metas encontradas: ${goalsData.data.length}`);
        
        goalsData.data.forEach((goal, index) => {
          console.log(`   Meta ${index + 1}:`);
          console.log(`     ID: ${goal.id}`);
          console.log(`     Nome: ${goal.nome}`);
          console.log(`     Status: ${goal.status}`);
          console.log(`     Member ID: ${goal.member_id}`);
          console.log(`     Data de vencimento: ${goal.due_date}`);
          console.log(`     Valor meta: ${goal.valor_meta}`);
          console.log(`     Valor atual: ${goal.valor_atual}`);
        });
      } else {
        console.log('❌ Estrutura de dados inesperada ou vazia');
      }
      
    } else {
      const errorData = await goalsResponse.text();
      console.log(`❌ Erro na chamada /goals: ${errorData}`);
    }
    
    // 4. Verificar estrutura esperada pelo frontend
    console.log('\n4. Verificando compatibilidade com estrutura do frontend...');
    
    // Verificar se a estrutura está compatível com goalService.ts
    const expectedFields = ['id', 'nome', 'status', 'due_date', 'member_id'];
    
    if (goalsResponse.ok) {
      const goalsData = await goalsResponse.json();
      if (goalsData.data && goalsData.data.length > 0) {
        const firstGoal = goalsData.data[0];
        
        expectedFields.forEach(field => {
          if (firstGoal.hasOwnProperty(field)) {
            console.log(`   ✅ Campo '${field}' presente`);
          } else {
            console.log(`   ❌ Campo '${field}' ausente`);
          }
        });
      }
    }
    
  } catch (error) {
    console.log(`❌ Erro geral: ${error.message}`);
  }
}

debugFrontendAPI().catch(console.error);