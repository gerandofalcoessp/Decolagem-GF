const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ixqjqfqhqvqjqfqhqvqj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxZnFocXZxanFmcWhxdnFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk4NzE0NywiZXhwIjoyMDUwNTYzMTQ3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCreateUserFixed() {
  console.log('🧪 Testando criação de usuário com endpoint corrigido...\n');

  const testUser = {
    email: `test-fixed-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    nome: 'Usuário Teste Corrigido',
    role: 'user',
    regional: 'São Paulo'
  };

  let createdUserId = null;

  try {
    // 1. Health check do backend
    console.log('1. Verificando status do backend...');
    const healthResponse = await fetch('http://localhost:4005/health');
    console.log(`   Status: ${healthResponse.status}`);
    
    if (healthResponse.status !== 200) {
      throw new Error('Backend não está respondendo corretamente');
    }

    // 2. Testar criação via API do backend (endpoint corrigido)
    console.log('\n2. Testando criação via API do backend (endpoint público)...');
    const apiResponse = await fetch('http://localhost:4005/api/auth/register-public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const apiData = await apiResponse.json();
    console.log(`   Status: ${apiResponse.status}`);
    console.log(`   Response:`, apiData);

    if (apiResponse.ok) {
      createdUserId = apiData.user?.id;
      console.log(`   ✅ Usuário criado via API: ${createdUserId}`);
      
      // 3. Verificar sincronização na tabela usuarios
      console.log('\n3. Verificando sincronização na tabela usuarios...');
      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', testUser.email);

      if (usuariosError) {
        console.log(`   ❌ Erro ao verificar tabela usuarios: ${usuariosError.message}`);
      } else if (usuarios && usuarios.length > 0) {
        console.log(`   ✅ Usuário sincronizado na tabela usuarios:`, usuarios[0]);
      } else {
        console.log(`   ⚠️ Usuário não encontrado na tabela usuarios`);
      }
    } else {
      console.log(`   ❌ Falha na criação via API: ${apiData.error || apiData.details || 'Erro desconhecido'}`);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    // 4. Limpeza dos dados de teste
    if (createdUserId) {
      console.log('\n4. Limpando dados de teste...');
      try {
        // Remover do Auth
        const { error: authError } = await supabase.auth.admin.deleteUser(createdUserId);
        if (authError) {
          console.log(`   ⚠️ Erro ao remover do Auth: ${authError.message}`);
        } else {
          console.log(`   ✅ Usuário removido do Auth`);
        }

        // Remover da tabela usuarios (se existir)
        const { error: tableError } = await supabase
          .from('usuarios')
          .delete()
          .eq('email', testUser.email);
        
        if (tableError) {
          console.log(`   ⚠️ Erro ao remover da tabela usuarios: ${tableError.message}`);
        } else {
          console.log(`   ✅ Usuário removido da tabela usuarios`);
        }
      } catch (cleanupError) {
        console.log(`   ⚠️ Erro na limpeza: ${cleanupError.message}`);
      }
    }
  }

  console.log('\n🏁 Teste concluído!');
}

testCreateUserFixed();