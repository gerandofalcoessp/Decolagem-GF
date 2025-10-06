const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUsuariosMigration() {
  console.log('🧪 Testando migração para tabela usuarios...\n');

  try {
    // 1. Verificar se a tabela usuarios existe e tem dados
    console.log('1. Verificando tabela usuarios...');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: true });

    if (usuariosError) {
      console.error('❌ Erro ao buscar usuarios:', usuariosError);
      return;
    }

    console.log(`✅ Tabela usuarios encontrada com ${usuarios.length} registros:`);
    usuarios.forEach(user => {
      console.log(`   - ${user.nome} (${user.email}) - Role: ${user.role} - Regional: ${user.regional || 'N/A'}`);
    });

    // 2. Testar endpoint /me com um usuário existente
    console.log('\n2. Testando endpoint /me...');
    
    // Pegar o primeiro usuário para teste
    if (usuarios.length > 0) {
      const testUser = usuarios[0];
      
      try {
        const response = await fetch('http://localhost:3001/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.auth_user_id}` // Simulando token
          }
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ Endpoint /me funcionando:', userData);
        } else {
          console.log('⚠️ Endpoint /me retornou erro (esperado sem token válido):', response.status);
        }
      } catch (error) {
        console.log('⚠️ Erro ao testar endpoint /me (servidor pode não estar rodando):', error.message);
      }
    }

    // 3. Testar endpoint /users (listagem)
    console.log('\n3. Testando endpoint /users...');
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const usersData = await response.json();
        console.log('✅ Endpoint /users funcionando:', usersData.length, 'usuários retornados');
      } else {
        console.log('⚠️ Endpoint /users retornou erro:', response.status);
      }
    } catch (error) {
      console.log('⚠️ Erro ao testar endpoint /users (servidor pode não estar rodando):', error.message);
    }

    // 4. Verificar consistência dos dados
    console.log('\n4. Verificando consistência dos dados...');
    
    // Buscar usuários do Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários do Auth:', authError);
      return;
    }

    console.log(`✅ Usuários no Supabase Auth: ${authUsers.users.length}`);
    console.log(`✅ Usuários na tabela usuarios: ${usuarios.length}`);

    // Verificar se todos os usuários do Auth têm entrada na tabela usuarios
    let inconsistencies = 0;
    for (const authUser of authUsers.users) {
      const usuarioEntry = usuarios.find(u => u.auth_user_id === authUser.id);
      if (!usuarioEntry) {
        console.log(`⚠️ Usuário ${authUser.email} (${authUser.id}) não encontrado na tabela usuarios`);
        inconsistencies++;
      }
    }

    if (inconsistencies === 0) {
      console.log('✅ Todos os usuários do Auth têm entrada na tabela usuarios');
    } else {
      console.log(`⚠️ ${inconsistencies} inconsistências encontradas`);
    }

    // 5. Verificar estrutura da tabela
    console.log('\n5. Verificando estrutura da tabela usuarios...');
    
    if (usuarios.length > 0) {
      const sampleUser = usuarios[0];
      const expectedFields = ['id', 'auth_user_id', 'nome', 'email', 'funcao', 'area', 'regional', 'tipo', 'role', 'status', 'created_at', 'updated_at'];
      
      const missingFields = expectedFields.filter(field => !(field in sampleUser));
      const extraFields = Object.keys(sampleUser).filter(field => !expectedFields.includes(field));
      
      if (missingFields.length === 0 && extraFields.length === 0) {
        console.log('✅ Estrutura da tabela usuarios está correta');
      } else {
        if (missingFields.length > 0) {
          console.log('⚠️ Campos faltando:', missingFields);
        }
        if (extraFields.length > 0) {
          console.log('⚠️ Campos extras:', extraFields);
        }
      }
    }

    console.log('\n🎉 Teste de migração concluído!');
    
    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log(`✅ Tabela usuarios: ${usuarios.length} registros`);
    console.log(`✅ Usuários Auth: ${authUsers.users.length} registros`);
    console.log(`${inconsistencies === 0 ? '✅' : '⚠️'} Consistência: ${inconsistencies === 0 ? 'OK' : inconsistencies + ' inconsistências'}`);
    
    if (inconsistencies === 0 && usuarios.length > 0) {
      console.log('\n🎯 MIGRAÇÃO VALIDADA COM SUCESSO!');
      console.log('Próximos passos:');
      console.log('1. Testar funcionalidade completa da aplicação');
      console.log('2. Atualizar hooks do frontend');
      console.log('3. Implementar triggers de sincronização');
      console.log('4. Deprecar tabela members (após validação completa)');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testUsuariosMigration().then(() => {
  console.log('\n✅ Script de teste finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});