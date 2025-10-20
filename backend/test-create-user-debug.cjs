const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testCreateUserDebug() {
  console.log('🔍 Testando criação de usuário com debug detalhado...\n');

  const testEmail = `debug-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  let authUserId = null;

  try {
    // 1. Testar criação via API do backend
    console.log('1️⃣ Testando criação via API do backend...');
    console.log('URL:', 'http://localhost:4000/api/auth/register');
    
    const userData = {
      email: testEmail,
      password: testPassword,
      nome: 'Usuário Debug Test',
      tipo: 'Regional',
      permissao: 'admin',
      funcao: 'Coordenador',
      area: 'R. São Paulo'
    };
    
    console.log('Dados enviados:', JSON.stringify(userData, null, 2));

    const createResponse = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    console.log('Status da resposta:', createResponse.status);
    console.log('Headers da resposta:', Object.fromEntries(createResponse.headers.entries()));

    const responseText = await createResponse.text();
    console.log('Resposta completa:', responseText);

    if (createResponse.ok) {
      const createResult = JSON.parse(responseText);
      console.log('✅ Usuário criado com sucesso:', createResult);
    } else {
      console.log('❌ Erro na criação:', responseText);
      
      // Tentar parsear como JSON para ver detalhes do erro
      try {
        const errorData = JSON.parse(responseText);
        console.log('Detalhes do erro:', JSON.stringify(errorData, null, 2));
      } catch (parseError) {
        console.log('Erro não é JSON válido');
      }
    }

    // 2. Testar criação direta via Supabase Admin para comparação
    console.log('\n2️⃣ Testando criação direta via Supabase Admin...');
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: `direct-${testEmail}`,
      password: testPassword,
      user_metadata: {
        nome: 'Usuário Direct Test',
        tipo: 'Regional',
        permissao: 'admin',
        funcao: 'Coordenador',
        area: 'R. São Paulo'
      }
    });

    if (authError) {
      console.error('❌ Erro na criação direta:', authError);
    } else {
      console.log('✅ Usuário criado diretamente:', authUser.user.id);
      authUserId = authUser.user.id;
      
      // Aguardar sincronização
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar sincronização
      const { data: usuarioData, error: usuarioError } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (usuarioError) {
        console.error('❌ Erro na sincronização:', usuarioError);
      } else {
        console.log('✅ Usuário sincronizado:', usuarioData);
      }
    }

    // 3. Verificar status do backend
    console.log('\n3️⃣ Verificando status do backend...');
    
    try {
      const healthResponse = await fetch('http://localhost:4000/health');
      console.log('Status do health check:', healthResponse.status);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.text();
        console.log('Health check response:', healthData);
      }
    } catch (healthError) {
      console.error('❌ Erro no health check:', healthError.message);
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  } finally {
    // Limpeza
    if (authUserId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        console.log('🧹 Limpeza realizada');
      } catch (cleanupError) {
        console.warn('⚠️ Erro na limpeza:', cleanupError);
      }
    }
  }
}

testCreateUserDebug().catch(console.error);