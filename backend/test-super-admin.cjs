const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqjqfqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxZnFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY1OTI4NzEsImV4cCI6MjA0MjE2ODg3MX0.example';

async function testSuperAdmin() {
  console.log('🧪 Testando com usuário super_admin real...\n');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Login com o usuário super_admin
    console.log('🔐 Fazendo login com super_admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'flavioalmeidaf3@gmail.com',
      password: 'sua_senha_aqui' // Você precisará fornecer a senha real
    });

    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }

    const token = authData.session.access_token;
    console.log('✅ Login realizado com sucesso');
    console.log('   Token:', token.substring(0, 20) + '...\n');

    // Importar fetch dinamicamente
    const fetch = (await import('node-fetch')).default;

    // Testar endpoint /me
    console.log('🔍 Testando endpoint /me...');
    const meResponse = await fetch('http://localhost:4000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const meData = await meResponse.json();
    console.log('   Status:', meResponse.status);
    console.log('   Role do usuário:', meData.member?.role);
    console.log('   Dados:', JSON.stringify(meData, null, 2), '\n');

    // Testar POST /api/regional-activities
    console.log('🔍 Testando POST /api/regional-activities...');
    const postResponse = await fetch('http://localhost:4000/api/regional-activities', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Teste Super Admin',
        description: 'Teste com usuário super_admin',
        activity_date: '2024-01-15',
        type: 'workshop',
        regional: 'R. Centro-Oeste'
      })
    });

    const postData = await postResponse.json();
    console.log('   Status:', postResponse.status);
    
    if (postResponse.status === 201) {
      console.log('✅ POST funcionou corretamente!');
      console.log('   Atividade criada:', postData.data?.id);
    } else {
      console.log('❌ POST falhou');
      console.log('   Resposta:', JSON.stringify(postData, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testSuperAdmin();