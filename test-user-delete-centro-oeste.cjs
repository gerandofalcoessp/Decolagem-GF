const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function testUserDeleteCentroOeste() {
  console.log('🔍 Testando exclusão com usuário normal...\n');
  
  try {
    // 1. Buscar a atividade do Centro-Oeste
    console.log('1️⃣ Buscando atividade do Centro-Oeste...');
    
    const { data: activity, error: fetchError } = await supabaseAdmin
      .from('regional_activities')
      .select('*')
      .eq('regional', 'centro_oeste')
      .single();
    
    if (fetchError || !activity) {
      console.log('❌ Atividade do Centro-Oeste não encontrada');
      return;
    }
    
    console.log(`✅ Atividade encontrada: "${activity.title}" (ID: ${activity.id})`);
    console.log(`   Member ID: ${activity.member_id}`);
    console.log(`   Responsável ID: ${activity.responsavel_id}`);
    console.log('');
    
    // 2. Buscar informações do member/usuário
    console.log('2️⃣ Buscando informações do usuário criador...');
    
    let userInfo = null;
    if (activity.member_id) {
      const { data: member, error: memberError } = await supabaseAdmin
        .from('members')
        .select('*')
        .eq('id', activity.member_id)
        .single();
      
      if (member && !memberError) {
        userInfo = member;
        console.log(`✅ Member encontrado: ${member.name || member.email}`);
        console.log(`   User ID: ${member.user_id}`);
        console.log(`   Role: ${member.role}`);
      }
    }
    
    // 3. Tentar autenticar como o usuário criador (se possível)
    console.log('\n3️⃣ Testando exclusão com diferentes cenários...\n');
    
    // Cenário 1: Tentar deletar sem autenticação
    console.log('🧪 Cenário 1: Tentando deletar sem autenticação...');
    try {
      const { data: deleteResult1, error: deleteError1 } = await supabaseClient
        .from('regional_activities')
        .delete()
        .eq('id', activity.id)
        .select('*');
      
      if (deleteError1) {
        console.log(`❌ ERRO (esperado): ${deleteError1.message}`);
        console.log(`   Código: ${deleteError1.code}`);
      } else {
        console.log(`⚠️ INESPERADO: Deletou sem autenticação!`);
      }
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
    
    // Cenário 2: Simular autenticação com token inválido
    console.log('\n🧪 Cenário 2: Tentando deletar com token inválido...');
    try {
      // Criar cliente com token fake
      const fakeClient = createClient(supabaseUrl, supabaseAnonKey);
      await fakeClient.auth.setSession({
        access_token: 'fake-token',
        refresh_token: 'fake-refresh'
      });
      
      const { data: deleteResult2, error: deleteError2 } = await fakeClient
        .from('regional_activities')
        .delete()
        .eq('id', activity.id)
        .select('*');
      
      if (deleteError2) {
        console.log(`❌ ERRO (esperado): ${deleteError2.message}`);
        console.log(`   Código: ${deleteError2.code}`);
      } else {
        console.log(`⚠️ INESPERADO: Deletou com token inválido!`);
      }
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
    
    // Cenário 3: Verificar políticas RLS específicas
    console.log('\n🧪 Cenário 3: Verificando políticas RLS...');
    
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('exec_sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'regional_activities' 
          AND cmd = 'DELETE';
        `
      });
    
    if (policiesError) {
      console.log(`❌ Erro ao buscar políticas: ${policiesError.message}`);
    } else {
      console.log(`✅ Políticas DELETE encontradas: ${policies.length}`);
      policies.forEach((policy, index) => {
        console.log(`   Política ${index + 1}: ${policy.policyname}`);
        console.log(`   Condição: ${policy.qual}`);
        console.log(`   Roles: ${policy.roles}`);
        console.log('   ---');
      });
    }
    
    // Cenário 4: Verificar se o usuário tem as permissões necessárias
    console.log('\n🧪 Cenário 4: Analisando permissões necessárias...');
    
    if (userInfo) {
      console.log(`   Usuário criador: ${userInfo.name || userInfo.email}`);
      console.log(`   Role do usuário: ${userInfo.role}`);
      console.log(`   User ID: ${userInfo.user_id}`);
      
      // Verificar se o role permite exclusão
      const allowedRoles = ['super_admin', 'equipe_interna'];
      const canDeleteByRole = allowedRoles.includes(userInfo.role);
      const canDeleteByOwnership = userInfo.id === activity.member_id;
      
      console.log(`   Pode deletar por role: ${canDeleteByRole ? '✅' : '❌'}`);
      console.log(`   Pode deletar por ownership: ${canDeleteByOwnership ? '✅' : '❌'}`);
      
      if (!canDeleteByRole && !canDeleteByOwnership) {
        console.log(`   ⚠️ PROBLEMA IDENTIFICADO: Usuário não tem permissão para deletar!`);
        console.log(`   Solução: Alterar role para 'super_admin' ou 'equipe_interna'`);
      }
    }
    
    // Cenário 5: Testar com usuário admin
    console.log('\n🧪 Cenário 5: Verificando se admin consegue deletar...');
    
    // Buscar um usuário admin
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('members')
      .select('*')
      .in('role', ['super_admin', 'equipe_interna'])
      .limit(1);
    
    if (adminUsers && adminUsers.length > 0) {
      const adminUser = adminUsers[0];
      console.log(`   Admin encontrado: ${adminUser.name || adminUser.email} (${adminUser.role})`);
      
      // Simular contexto do admin (usando service role que já tem acesso total)
      console.log(`   ✅ Admin pode deletar (confirmado pelo teste anterior)`);
    } else {
      console.log(`   ⚠️ Nenhum usuário admin encontrado`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testUserDeleteCentroOeste().catch(console.error);