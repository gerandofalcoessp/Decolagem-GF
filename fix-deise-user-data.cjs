const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixDeiseUserData() {
  console.log('🔧 Corrigindo dados do usuário Deise...\n');
  
  try {
    // 1. Buscar dados atuais da Deise
    console.log('1️⃣ Buscando dados atuais da Deise...');
    
    const { data: deiseData, error: deiseError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('name', 'Deise')
      .single();
    
    if (deiseError || !deiseData) {
      console.log('❌ Erro ao buscar Deise:', deiseError?.message);
      return;
    }
    
    console.log('✅ Dados atuais da Deise:');
    console.log(`   ID: ${deiseData.id}`);
    console.log(`   Auth User ID: ${deiseData.auth_user_id}`);
    console.log(`   Nome: ${deiseData.name}`);
    console.log(`   Email: ${deiseData.email}`);
    console.log(`   Função: ${deiseData.funcao}`);
    console.log(`   User ID: ${deiseData.user_id}`);
    console.log(`   Role: ${deiseData.role}`);
    console.log('');
    
    // 2. Verificar se existe auth_user_id e usar como user_id
    let updateData = {};
    let needsUpdate = false;
    
    if (!deiseData.user_id && deiseData.auth_user_id) {
      console.log('2️⃣ Corrigindo user_id...');
      updateData.user_id = deiseData.auth_user_id;
      needsUpdate = true;
      console.log(`   Definindo user_id como: ${deiseData.auth_user_id}`);
    }
    
    // 3. Definir role apropriado baseado na função
    if (!deiseData.role) {
      console.log('3️⃣ Definindo role apropriado...');
      
      // Como é coordenador regional, vamos dar permissão de equipe_interna
      updateData.role = 'equipe_interna';
      needsUpdate = true;
      console.log(`   Definindo role como: equipe_interna`);
    }
    
    // 4. Atualizar dados se necessário
    if (needsUpdate) {
      console.log('4️⃣ Atualizando dados da Deise...');
      
      const { data: updatedData, error: updateError } = await supabaseAdmin
        .from('members')
        .update(updateData)
        .eq('id', deiseData.id)
        .select('*')
        .single();
      
      if (updateError) {
        console.log('❌ Erro ao atualizar:', updateError.message);
      } else {
        console.log('✅ Dados atualizados com sucesso:');
        console.log(`   User ID: ${updatedData.user_id}`);
        console.log(`   Role: ${updatedData.role}`);
      }
    } else {
      console.log('ℹ️ Nenhuma atualização necessária');
    }
    
    // 5. Verificar outros usuários com problemas similares
    console.log('\n5️⃣ Verificando outros usuários com problemas similares...');
    
    const { data: problematicUsers, error: problematicError } = await supabaseAdmin
      .from('members')
      .select('*')
      .or('user_id.is.null,role.is.null');
    
    if (problematicError) {
      console.log('❌ Erro ao buscar usuários problemáticos:', problematicError.message);
    } else {
      console.log(`✅ Encontrados ${problematicUsers.length} usuários com dados incompletos:`);
      
      problematicUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || user.email}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      User ID: ${user.user_id || 'NULL'}`);
        console.log(`      Role: ${user.role || 'NULL'}`);
        console.log(`      Auth User ID: ${user.auth_user_id || 'NULL'}`);
        console.log('      ---');
      });
      
      if (problematicUsers.length > 1) {
        console.log('\n⚠️ Outros usuários também precisam de correção!');
      }
    }
    
    // 6. Testar exclusão após correção
    console.log('\n6️⃣ Testando exclusão após correção...');
    
    const { data: activity, error: activityError } = await supabaseAdmin
      .from('regional_activities')
      .select('*')
      .eq('regional', 'centro_oeste')
      .single();
    
    if (activity && !activityError) {
      console.log(`   Atividade encontrada: "${activity.title}"`);
      console.log(`   Member ID: ${activity.member_id}`);
      
      // Verificar se agora o member tem os dados corretos
      const { data: updatedMember, error: memberError } = await supabaseAdmin
        .from('members')
        .select('*')
        .eq('id', activity.member_id)
        .single();
      
      if (updatedMember && !memberError) {
        console.log(`   ✅ Member atualizado:`);
        console.log(`      User ID: ${updatedMember.user_id}`);
        console.log(`      Role: ${updatedMember.role}`);
        
        // Verificar se agora atende aos critérios da política RLS
        const canDeleteByRole = ['super_admin', 'equipe_interna'].includes(updatedMember.role);
        const canDeleteByOwnership = updatedMember.id === activity.member_id;
        
        console.log(`   Pode deletar por role: ${canDeleteByRole ? '✅' : '❌'}`);
        console.log(`   Pode deletar por ownership: ${canDeleteByOwnership ? '✅' : '❌'}`);
        
        if (canDeleteByRole || canDeleteByOwnership) {
          console.log(`   ✅ Usuário agora tem permissão para deletar!`);
        } else {
          console.log(`   ❌ Usuário ainda não tem permissão para deletar`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixDeiseUserData().catch(console.error);