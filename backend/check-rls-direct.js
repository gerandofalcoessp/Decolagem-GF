import 'dotenv/config';
import { supabaseAdmin } from './src/services/supabaseClient.js';

async function checkRLSPolicies() {
  console.log('🔍 Verificando políticas RLS diretamente...\n');

  try {
    // 1. Verificar se podemos criar uma regional primeiro
    console.log('1. Testando criação de regional...');
    const { data: regional, error: regionalError } = await supabaseAdmin
      .from('regionals')
      .insert({ name: `Regional Teste ${Date.now()}` })
      .select('*')
      .single();

    if (regionalError) {
      console.error('❌ Erro ao criar regional:', regionalError.message);
      return;
    }
    console.log('✅ Regional criada:', regional.name);

    // 2. Tentar criar membro com auth_user_id null usando supabaseAdmin
    console.log('\n2. Testando criação de membro com auth_user_id null...');
    const testMember = {
      name: 'Teste Admin Member',
      email: `teste-admin-${Date.now()}@example.com`,
      regional_id: regional.id,
      auth_user_id: null
    };

    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .insert(testMember)
      .select('*')
      .single();

    if (memberError) {
      console.error('❌ Erro ao criar membro:', memberError.message);
      console.error('Código do erro:', memberError.code);
      console.error('Detalhes:', memberError.details);
      console.error('Hint:', memberError.hint);
    } else {
      console.log('✅ Membro criado com sucesso:', member.name);
      
      // Limpar teste
      await supabaseAdmin.from('members').delete().eq('id', member.id);
      console.log('🧹 Membro de teste removido');
    }

    // Limpar regional de teste
    await supabaseAdmin.from('regionals').delete().eq('id', regional.id);
    console.log('🧹 Regional de teste removida');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkRLSPolicies();