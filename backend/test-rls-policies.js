import { supabaseAdmin } from './src/services/supabaseClient.js';

async function testRLSPolicies() {
  console.log('🔍 Testando políticas RLS da tabela members...\n');

  try {
    // 1. Verificar se as políticas existem
    console.log('1. Verificando políticas existentes:');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('policyname, cmd, qual, with_check')
      .eq('tablename', 'members')
      .eq('schemaname', 'public');

    if (policiesError) {
      console.error('❌ Erro ao buscar políticas:', policiesError.message);
      return;
    }

    console.log('Políticas encontradas:');
    policies.forEach(policy => {
      console.log(`  - ${policy.policyname} (${policy.cmd})`);
    });
    console.log('');

    // 2. Testar inserção com auth_user_id null (caso admin)
    console.log('2. Testando inserção com auth_user_id null:');
    
    // Primeiro, obter um regional_id válido
    const { data: regionals, error: regionalsError } = await supabaseAdmin
      .from('regionals')
      .select('id')
      .limit(1);

    if (regionalsError || !regionals || regionals.length === 0) {
      console.error('❌ Erro ao buscar regionais ou nenhuma regional encontrada');
      return;
    }

    const regionalId = regionals[0].id;

    // Tentar inserir um membro com auth_user_id null
    const testMember = {
      name: 'Teste Admin Member',
      email: `teste-admin-${Date.now()}@example.com`,
      regional_id: regionalId,
      auth_user_id: null
    };

    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('members')
      .insert(testMember)
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir membro com auth_user_id null:', insertError.message);
    } else {
      console.log('✅ Membro inserido com sucesso:', insertResult.name);
      
      // Limpar o teste
      await supabaseAdmin
        .from('members')
        .delete()
        .eq('id', insertResult.id);
      console.log('🧹 Membro de teste removido');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testRLSPolicies();