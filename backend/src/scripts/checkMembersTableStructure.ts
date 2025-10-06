import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkMembersTableStructure() {
  console.log('🔍 Verificando estrutura da tabela members...');

  try {
    // 1. Tentar buscar alguns registros para ver a estrutura
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .limit(1);

    if (membersError) {
      console.error('❌ Erro ao buscar members:', membersError);
      return;
    }

    if (members && members.length > 0) {
      console.log('✅ Estrutura da tabela members:');
      console.log('Colunas disponíveis:', Object.keys(members[0]));
      console.log('Exemplo de registro:', members[0]);
    } else {
      console.log('📋 Tabela members está vazia');
    }

    // 2. Verificar se o usuário de teste já tem um registro
    const { data: testUser, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'teste@decolagem.com')
      .single();

    if (testUser) {
      console.log('👤 Usuário de teste encontrado:', testUser.id);
      
      const { data: memberRecord, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', testUser.id)
        .single();

      if (memberRecord) {
        console.log('✅ Registro na tabela members existe:', memberRecord);
      } else {
        console.log('❌ Usuário não tem registro na tabela members');
      }
    }

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

checkMembersTableStructure();