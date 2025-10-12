const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSStatus() {
  console.log('🔍 Verificando status do RLS na tabela regional_activities...\n');
  
  try {
    // 1. Verificar se RLS está habilitado usando uma query direta
    console.log('1️⃣ Verificando se RLS está habilitado...');
    
    // Usar rpc para executar uma query SQL direta
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .rpc('exec_sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity,
            forcerowsecurity
          FROM pg_tables 
          WHERE tablename = 'regional_activities' 
          AND schemaname = 'public';
        `
      });
    
    if (rlsError) {
      console.log('❌ Erro ao verificar RLS (tentativa 1):', rlsError.message);
      
      // Tentar método alternativo
      console.log('🔄 Tentando método alternativo...');
      
      const { data: altCheck, error: altError } = await supabaseAdmin
        .from('regional_activities')
        .select('count', { count: 'exact', head: true });
      
      if (altError) {
        console.log('❌ Erro no método alternativo:', altError.message);
        console.log('   Isso pode indicar que RLS está funcionando e bloqueando acesso');
      } else {
        console.log('✅ Conseguimos acessar a tabela - RLS pode não estar funcionando corretamente');
      }
    } else {
      console.log('✅ Status RLS obtido:', rlsStatus);
    }
    
    // 2. Listar políticas existentes
    console.log('\n2️⃣ Verificando políticas RLS existentes...');
    
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('exec_sql', {
        query: `
          SELECT 
            policyname,
            cmd,
            permissive,
            roles,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'regional_activities' 
          AND schemaname = 'public';
        `
      });
    
    if (policiesError) {
      console.log('❌ Erro ao listar políticas:', policiesError.message);
    } else {
      console.log('✅ Políticas encontradas:');
      if (policies && policies.length > 0) {
        policies.forEach((policy, index) => {
          console.log(`   ${index + 1}. ${policy.policyname}`);
          console.log(`      Comando: ${policy.cmd}`);
          console.log(`      Roles: ${policy.roles}`);
          console.log(`      Condição: ${policy.qual}`);
          console.log('');
        });
      } else {
        console.log('   ❌ Nenhuma política encontrada!');
      }
    }
    
    // 3. Testar acesso sem autenticação
    console.log('3️⃣ Testando acesso sem autenticação...');
    
    const supabaseAnon = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || 'your-anon-key');
    
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('regional_activities')
      .select('count', { count: 'exact', head: true });
    
    if (anonError) {
      console.log('✅ Acesso negado sem autenticação - RLS funcionando:', anonError.message);
    } else {
      console.log('❌ Acesso permitido sem autenticação - RLS NÃO está funcionando!');
      console.log(`   Contagem: ${anonData}`);
    }
    
    // 4. Verificar se conseguimos habilitar RLS (caso não esteja)
    console.log('\n4️⃣ Tentando habilitar RLS...');
    
    const { data: enableRLS, error: enableError } = await supabaseAdmin
      .rpc('exec_sql', {
        query: 'ALTER TABLE public.regional_activities ENABLE ROW LEVEL SECURITY;'
      });
    
    if (enableError) {
      console.log('ℹ️ Erro ao habilitar RLS:', enableError.message);
      console.log('   (Pode ser que já esteja habilitado)');
    } else {
      console.log('✅ RLS habilitado com sucesso');
    }
    
    // 5. Verificar políticas específicas para DELETE
    console.log('\n5️⃣ Verificando política DELETE específica...');
    
    const { data: deletePolicies, error: deleteError } = await supabaseAdmin
      .rpc('exec_sql', {
        query: `
          SELECT 
            policyname,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'regional_activities' 
          AND schemaname = 'public'
          AND cmd = 'DELETE';
        `
      });
    
    if (deleteError) {
      console.log('❌ Erro ao verificar políticas DELETE:', deleteError.message);
    } else {
      console.log('✅ Políticas DELETE encontradas:');
      if (deletePolicies && deletePolicies.length > 0) {
        deletePolicies.forEach((policy, index) => {
          console.log(`   ${index + 1}. ${policy.policyname}`);
          console.log(`      Condição: ${policy.qual}`);
        });
      } else {
        console.log('   ❌ Nenhuma política DELETE encontrada!');
        console.log('   🔧 Isso explica por que a exclusão não funciona');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkRLSStatus().catch(console.error);