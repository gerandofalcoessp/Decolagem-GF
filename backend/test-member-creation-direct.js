import 'dotenv/config';
import { supabaseAdmin } from './src/services/supabaseClient.js';

async function testMemberCreation() {
  console.log('🔍 Testando criação de membros com auth_user_id null...\n');

  try {
    // 1. Obter um regional_id válido
    console.log('1. Buscando regional válida...');
    const { data: regionals, error: regionalsError } = await supabaseAdmin
      .from('regionals')
      .select('id, name')
      .limit(1);

    if (regionalsError) {
      console.error('❌ Erro ao buscar regionais:', regionalsError.message);
      return;
    }

    if (!regionals || regionals.length === 0) {
      console.error('❌ Nenhuma regional encontrada');
      return;
    }

    const regional = regionals[0];
    console.log(`✅ Regional encontrada: ${regional.name} (${regional.id})\n`);

    // 2. Testar inserção com auth_user_id null
    console.log('2. Testando inserção com auth_user_id null...');
    
    const testMember = {
      name: 'Teste Admin Member',
      email: `teste-admin-${Date.now()}@example.com`,
      regional_id: regional.id,
      auth_user_id: null
    };

    console.log('Dados do membro:', testMember);

    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('members')
      .insert(testMember)
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir membro:', insertError.message);
      console.error('Detalhes do erro:', insertError);
    } else {
      console.log('✅ Membro inserido com sucesso!');
      console.log('Dados inseridos:', insertResult);
      
      // 3. Limpar o teste
      console.log('\n3. Removendo membro de teste...');
      const { error: deleteError } = await supabaseAdmin
        .from('members')
        .delete()
        .eq('id', insertResult.id);

      if (deleteError) {
        console.error('❌ Erro ao remover membro de teste:', deleteError.message);
      } else {
        console.log('✅ Membro de teste removido com sucesso');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testMemberCreation();