const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('🔍 Verificando políticas RLS para regional_activities...\n');
  
  try {
    // 1. Verificar se RLS está habilitado na tabela
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'regional_activities');
    
    if (tableError) {
      console.log('❌ Erro ao buscar informações da tabela:', tableError.message);
    } else {
      console.log('📋 Informações da tabela regional_activities:', tableInfo);
    }
    
    // 2. Verificar políticas RLS existentes
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('sql', {
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
          ORDER BY cmd, policyname;
        `
      });
    
    if (policiesError) {
      console.log('❌ Erro ao buscar políticas RLS:', policiesError.message);
    } else {
      console.log('🔒 Políticas RLS encontradas:');
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`\n📝 Política: ${policy.policyname}`);
          console.log(`   Comando: ${policy.cmd}`);
          console.log(`   Permissiva: ${policy.permissive}`);
          console.log(`   Roles: ${policy.roles}`);
          console.log(`   Qualificação: ${policy.qual}`);
          console.log(`   With Check: ${policy.with_check}`);
        });
      } else {
        console.log('   ⚠️ Nenhuma política RLS encontrada');
      }
    }
    
    // 3. Verificar especificamente se existe política DELETE
    const deletePolicies = policies?.filter(p => p.cmd === 'DELETE') || [];
    console.log(`\n🗑️ Políticas DELETE encontradas: ${deletePolicies.length}`);
    
    if (deletePolicies.length === 0) {
      console.log('❌ PROBLEMA ENCONTRADO: Não existe política RLS para DELETE!');
      console.log('   Isso significa que nenhum usuário pode deletar registros da tabela regional_activities');
      console.log('   Mesmo com token válido, a operação DELETE será bloqueada pelo RLS');
    } else {
      deletePolicies.forEach(policy => {
        console.log(`\n✅ Política DELETE: ${policy.policyname}`);
        console.log(`   Condição: ${policy.qual}`);
      });
    }
    
    // 4. Verificar se RLS está habilitado
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .rpc('sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity
          FROM pg_tables 
          WHERE tablename = 'regional_activities';
        `
      });
    
    if (rlsError) {
      console.log('❌ Erro ao verificar status RLS:', rlsError.message);
    } else {
      console.log('\n🔐 Status RLS:', rlsStatus);
      if (rlsStatus && rlsStatus[0]?.rowsecurity) {
        console.log('✅ RLS está HABILITADO na tabela regional_activities');
      } else {
        console.log('⚠️ RLS está DESABILITADO na tabela regional_activities');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar políticas RLS:', error.message);
  }
}

checkRLSPolicies().catch(console.error);