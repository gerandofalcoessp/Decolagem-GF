const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeRLSPolicies() {
  console.log('🔒 Analisando políticas RLS para regional_activities...\n');

  try {
    // 1. Verificar se RLS está habilitado
    console.log('1️⃣ Verificando status do RLS...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_rls_status', { table_name: 'regional_activities' })
      .single();

    if (rlsError) {
      console.log('⚠️ Função check_rls_status não encontrada, verificando manualmente...');
      
      // Verificar manualmente através de query SQL
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_name', 'regional_activities')
        .eq('table_schema', 'public');

      if (tableError) {
        console.error('❌ Erro ao verificar tabela:', tableError.message);
      } else {
        console.log('✅ Tabela regional_activities encontrada');
      }
    } else {
      console.log('✅ Status RLS:', rlsStatus);
    }

    // 2. Listar políticas existentes
    console.log('\n2️⃣ Listando políticas RLS existentes...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'regional_activities');

    if (policiesError) {
      console.error('❌ Erro ao buscar políticas:', policiesError.message);
    } else {
      console.log(`✅ Encontradas ${policies.length} políticas:`);
      policies.forEach((policy, index) => {
        console.log(`\n   ${index + 1}. ${policy.policyname}`);
        console.log(`      - Comando: ${policy.cmd}`);
        console.log(`      - Permissivo: ${policy.permissive}`);
        console.log(`      - Roles: ${policy.roles}`);
        console.log(`      - Qual: ${policy.qual}`);
        console.log(`      - With Check: ${policy.with_check}`);
      });
    }

    // 3. Testar acesso como usuário autenticado
    console.log('\n3️⃣ Testando acesso como usuário autenticado...');
    
    // Login como Deise
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'coord.regional.co@gerandofalcoes.com',
      password: 'senha123'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }

    console.log('✅ Login realizado como:', authData.user.email);

    // Criar cliente autenticado
    const authenticatedSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28');
    
    await authenticatedSupabase.auth.setSession({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token
    });

    // Testar SELECT
    console.log('\n   📖 Testando SELECT...');
    const { data: selectData, error: selectError } = await authenticatedSupabase
      .from('regional_activities')
      .select('*')
      .limit(5);

    if (selectError) {
      console.error('   ❌ Erro no SELECT:', selectError.message);
    } else {
      console.log(`   ✅ SELECT funcionou - ${selectData.length} registros retornados`);
    }

    // Testar DELETE na atividade de teste
    console.log('\n   🗑️ Testando DELETE na atividade de teste...');
    const { data: deleteData, error: deleteError } = await authenticatedSupabase
      .from('regional_activities')
      .delete()
      .eq('title', 'TESTE - Atividade para Exclusão UI')
      .select();

    if (deleteError) {
      console.error('   ❌ Erro no DELETE:', deleteError.message);
      console.error('   📋 Detalhes do erro:', deleteError);
    } else {
      console.log(`   ✅ DELETE funcionou - ${deleteData.length} registros excluídos`);
      if (deleteData.length > 0) {
        console.log('   📋 Registro excluído:', deleteData[0].title);
      }
    }

    // 4. Verificar permissões do usuário atual
    console.log('\n4️⃣ Verificando permissões do usuário atual...');
    const { data: userInfo, error: userError } = await authenticatedSupabase
      .rpc('get_current_user_info');

    if (userError) {
      console.log('⚠️ Função get_current_user_info não encontrada');
    } else {
      console.log('✅ Informações do usuário:', userInfo);
    }

    // 5. Verificar dados do member
    console.log('\n5️⃣ Verificando dados do member...');
    const { data: memberData, error: memberError } = await authenticatedSupabase
      .from('members')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (memberError) {
      console.error('   ❌ Erro ao buscar member:', memberError.message);
    } else {
      console.log('   ✅ Member encontrado:');
      console.log('      - ID:', memberData.id);
      console.log('      - Nome:', memberData.name);
      console.log('      - Regional:', memberData.regional);
      console.log('      - Role:', memberData.role);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

analyzeRLSPolicies();