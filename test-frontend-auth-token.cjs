const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configurações do Supabase

const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendAuthToken() {
  console.log('🔐 Testando fluxo de autenticação e token do frontend...\n');

  try {
    // 1. Fazer login como Deise
    console.log('1️⃣ Fazendo login como Deise...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'coord.regional.co@gerandofalcoes.com',
      password: 'senha123'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }

    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário:', authData.user.email);
    console.log('🎫 Token (primeiros 50 chars):', authData.session.access_token.substring(0, 50) + '...');

    // 2. Testar login via API do backend (simulando frontend)
    console.log('\n2️⃣ Testando login via API do backend...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'coord.regional.co@gerandofalcoes.com',
        password: 'senha123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Erro no login via API:', loginResponse.status, loginResponse.statusText);
      const errorData = await loginResponse.text();
      console.error('📋 Detalhes do erro:', errorData);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login via API realizado com sucesso');
    console.log('👤 Usuário API:', loginData.user.email);
    console.log('🎫 Token API (primeiros 50 chars):', loginData.session.access_token.substring(0, 50) + '...');

    // 3. Criar atividade de teste
    console.log('\n3️⃣ Criando atividade de teste...');
    const testActivity = {
      title: 'TESTE - Token Auth Frontend',
      description: 'Atividade para testar autenticação via token do frontend.',
      regional: 'centro_oeste',
      member_id: '70357d45-7cac-4c12-83e8-778fa4ab913a',
      activity_date: new Date().toISOString().split('T')[0],
      status: 'ativo',
      programa: 'Decolagem',
      quantidade: 25,
      atividade_label: 'Atendidos Diretos',
      estados: ['GO', 'MT', 'MS', 'DF']
    };

    const createResponse = await fetch('http://localhost:4000/api/regional-activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.session.access_token}`
      },
      body: JSON.stringify(testActivity)
    });

    if (!createResponse.ok) {
      console.error('❌ Erro ao criar atividade:', createResponse.status, createResponse.statusText);
      const errorData = await createResponse.text();
      console.error('📋 Detalhes do erro:', errorData);
      return;
    }

    const createdActivity = await createResponse.json();
    console.log('✅ Atividade criada com sucesso');
    console.log('📋 ID da atividade:', createdActivity.data.id);
    console.log('📋 Título:', createdActivity.data.title);

    // 4. Testar exclusão via API (simulando frontend)
    console.log('\n4️⃣ Testando exclusão via API do backend...');
    const deleteResponse = await fetch(`http://localhost:4000/api/regional-activities/${createdActivity.data.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${loginData.session.access_token}`
      }
    });

    if (!deleteResponse.ok) {
      console.error('❌ Erro na exclusão via API:', deleteResponse.status, deleteResponse.statusText);
      const errorData = await deleteResponse.text();
      console.error('📋 Detalhes do erro:', errorData);
      
      // Verificar se o token está sendo enviado corretamente
      console.log('\n🔍 Verificando token enviado...');
      console.log('🎫 Token usado:', loginData.session.access_token.substring(0, 50) + '...');
      
      // Tentar verificar o token
      const verifyResponse = await fetch('http://localhost:4000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${loginData.session.access_token}`
        }
      });
      
      if (verifyResponse.ok) {
        const userData = await verifyResponse.json();
        console.log('✅ Token válido - Usuário:', userData.user.email);
      } else {
        console.error('❌ Token inválido:', verifyResponse.status);
      }
      
      return;
    }

    const deleteData = await deleteResponse.json();
    console.log('✅ Exclusão via API realizada com sucesso');
    console.log('📋 Dados da exclusão:', deleteData);

    // 5. Verificar se a atividade foi realmente excluída
    console.log('\n5️⃣ Verificando se a atividade foi excluída...');
    const checkResponse = await fetch(`http://localhost:4000/api/regional-activities`, {
      headers: {
        'Authorization': `Bearer ${loginData.session.access_token}`
      }
    });

    if (checkResponse.ok) {
      const activities = await checkResponse.json();
      const foundActivity = activities.data && activities.data.find(act => act.id === createdActivity.data.id);
      
      if (foundActivity) {
        console.log('⚠️ Atividade ainda existe no banco de dados');
      } else {
        console.log('✅ Atividade foi excluída com sucesso do banco de dados');
      }
    } else {
      console.log('❌ Erro ao verificar atividades:', checkResponse.status);
    }

    console.log('\n🎯 Resumo do teste:');
    console.log('✅ Login direto via Supabase: OK');
    console.log('✅ Login via API do backend: OK');
    console.log('✅ Criação de atividade via API: OK');
    console.log('✅ Exclusão de atividade via API: OK');
    console.log('✅ Token de autenticação: Funcionando corretamente');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testFrontendAuthToken();