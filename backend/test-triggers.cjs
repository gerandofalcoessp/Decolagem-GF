const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTriggers() {
  console.log('🧪 Testando triggers de sincronização...\n');
  
  try {
    // 1. Testar criação de usuário
    console.log('1️⃣ Testando criação de usuário...');
    
    const testEmail = `test-trigger-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    // Criar usuário via Supabase Auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      user_metadata: {
        nome: 'Usuário Teste Trigger',
        funcao: 'Analista',
        regional: 'Nacional',
        role: 'user'
      }
    });
    
    if (createError) {
      console.error('❌ Erro ao criar usuário:', createError);
      return;
    }
    
    console.log('✅ Usuário criado:', newUser.user.id);
    
    // Aguardar um pouco para o trigger processar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se foi criado na tabela usuarios
    const { data: usuarioCreated, error: checkError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', newUser.user.id)
      .single();
    
    if (checkError) {
      console.error('❌ Erro ao verificar usuário na tabela usuarios:', checkError);
    } else {
      console.log('✅ Usuário encontrado na tabela usuarios:', usuarioCreated);
    }
    
    // 2. Testar atualização de usuário
    console.log('\n2️⃣ Testando atualização de usuário...');
    
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      newUser.user.id,
      {
        user_metadata: {
          nome: 'Usuário Teste Trigger Atualizado',
          funcao: 'Coordenador',
          regional: 'São Paulo',
          role: 'admin'
        }
      }
    );
    
    if (updateError) {
      console.error('❌ Erro ao atualizar usuário:', updateError);
    } else {
      console.log('✅ Usuário atualizado no Auth');
      
      // Aguardar um pouco para o trigger processar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se foi atualizado na tabela usuarios
      const { data: usuarioUpdated, error: checkUpdateError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', newUser.user.id)
        .single();
      
      if (checkUpdateError) {
        console.error('❌ Erro ao verificar atualização na tabela usuarios:', checkUpdateError);
      } else {
        console.log('✅ Usuário atualizado na tabela usuarios:', usuarioUpdated);
      }
    }
    
    // 3. Testar exclusão de usuário
    console.log('\n3️⃣ Testando exclusão de usuário...');
    
    const { data: deletedUser, error: deleteError } = await supabase.auth.admin.deleteUser(
      newUser.user.id
    );
    
    if (deleteError) {
      console.error('❌ Erro ao excluir usuário:', deleteError);
    } else {
      console.log('✅ Usuário excluído do Auth');
      
      // Aguardar um pouco para o trigger processar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se foi excluído da tabela usuarios
      const { data: usuarioDeleted, error: checkDeleteError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', newUser.user.id)
        .single();
      
      if (checkDeleteError && checkDeleteError.code === 'PGRST116') {
        console.log('✅ Usuário excluído da tabela usuarios (não encontrado)');
      } else if (checkDeleteError) {
        console.error('❌ Erro ao verificar exclusão na tabela usuarios:', checkDeleteError);
      } else {
        console.log('⚠️ Usuário ainda existe na tabela usuarios:', usuarioDeleted);
      }
    }
    
    console.log('\n🎉 Teste de triggers concluído!');
    
  } catch (err) {
    console.error('💥 Erro geral no teste:', err);
  }
}

testTriggers();