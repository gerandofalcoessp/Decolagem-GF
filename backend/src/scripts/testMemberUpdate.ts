import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMemberUpdate() {
  try {
    console.log('🧪 Testando atualização de membro...\n');

    // Buscar o membro problemático
    const { data: member, error: findError } = await supabase
      .from('members')
      .select('*')
      .eq('email', 'flavioalmeidaf3@gmail.com')
      .single();

    if (findError) {
      console.error('❌ Erro ao buscar membro:', findError.message);
      return;
    }

    console.log('📋 Membro encontrado:');
    console.log(`  - ID: ${member.id}`);
    console.log(`  - Nome: ${member.name}`);
    console.log(`  - Email: ${member.email}`);
    console.log(`  - Auth User ID: ${member.auth_user_id || 'null'}`);
    console.log();

    // Tentar atualizar com um campo simples
    console.log('🔄 Tentando atualizar o campo "name"...');
    
    const { data: updatedMember, error: updateError } = await supabase
      .from('members')
      .update({ name: member.name }) // Atualizar com o mesmo valor
      .eq('id', member.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Erro na atualização:', updateError.message);
      console.error('Detalhes do erro:', updateError);
      return;
    }

    console.log('✅ Atualização bem-sucedida!');
    console.log('📋 Dados atualizados:', updatedMember);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testMemberUpdate();