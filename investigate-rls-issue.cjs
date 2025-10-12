const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function investigateRLSIssue() {
  console.log('🔍 Investigando problemas com RLS...\n');
  
  try {
    // 1. Verificar se RLS está habilitado na tabela
    console.log('1️⃣ Verificando se RLS está habilitado...');
    
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'regional_activities');
    
    if (rlsError) {
      console.log('❌ Erro ao verificar RLS:', rlsError.message);
      
      // Tentar método alternativo
      console.log('🔄 Tentando método alternativo...');
      
      const { data: tableInfo, error: tableError } = await supabaseAdmin
        .rpc('sql', {
          query: `
            SELECT 
              schemaname,
              tablename,
              rowsecurity,
              forcerowsecurity
            FROM pg_tables 
            WHERE tablename = 'regional_activities';
          `
        });
      
      if (tableError) {
        console.log('❌ Erro no método alternativo:', tableError.message);
      } else {
        console.log('✅ Informações da tabela:', tableInfo);
      }
    } else {
      console.log('✅ Status RLS:', rlsStatus);
    }
    
    // 2. Verificar políticas existentes usando query direta
    console.log('\n2️⃣ Verificando políticas existentes...');
    
    try {
      const { data: policies, error: policiesError } = await supabaseAdmin
        .rpc('sql', {
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
            ORDER BY cmd, policyname;
          `
        });
      
      if (policiesError) {
        console.log('❌ Erro ao buscar políticas:', policiesError.message);
      } else {
        console.log(`✅ Políticas encontradas: ${policies.length}`);
        
        if (policies.length === 0) {
          console.log('⚠️ PROBLEMA: Nenhuma política RLS encontrada!');
        } else {
          policies.forEach((policy, index) => {
            console.log(`\n   Política ${index + 1}:`);
            console.log(`   Nome: ${policy.policyname}`);
            console.log(`   Comando: ${policy.cmd}`);
            console.log(`   Permissiva: ${policy.permissive}`);
            console.log(`   Roles: ${policy.roles}`);
            console.log(`   Condição: ${policy.qual}`);
            console.log(`   With Check: ${policy.with_check}`);
          });
        }
      }
    } catch (error) {
      console.log('❌ Erro ao executar query de políticas:', error.message);
    }
    
    // 3. Verificar se a tabela tem RLS forçado
    console.log('\n3️⃣ Verificando configuração de RLS forçado...');
    
    try {
      const { data: forceRLS, error: forceError } = await supabaseAdmin
        .rpc('sql', {
          query: `
            SELECT 
              c.relname as table_name,
              c.relrowsecurity as rls_enabled,
              c.relforcerowsecurity as rls_forced
            FROM pg_class c
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public' 
            AND c.relname = 'regional_activities';
          `
        });
      
      if (forceError) {
        console.log('❌ Erro ao verificar RLS forçado:', forceError.message);
      } else {
        console.log('✅ Configuração RLS:', forceRLS);
        
        if (forceRLS && forceRLS.length > 0) {
          const config = forceRLS[0];
          console.log(`   RLS Habilitado: ${config.rls_enabled}`);
          console.log(`   RLS Forçado: ${config.rls_forced}`);
          
          if (!config.rls_enabled) {
            console.log('⚠️ PROBLEMA CRÍTICO: RLS não está habilitado na tabela!');
          }
        }
      }
    } catch (error) {
      console.log('❌ Erro ao verificar configuração RLS:', error.message);
    }
    
    // 4. Verificar dados do usuário "Deise"
    console.log('\n4️⃣ Investigando dados do usuário "Deise"...');
    
    const { data: deiseData, error: deiseError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('name', 'Deise');
    
    if (deiseError) {
      console.log('❌ Erro ao buscar Deise:', deiseError.message);
    } else {
      console.log('✅ Dados da Deise:', deiseData);
      
      if (deiseData && deiseData.length > 0) {
        const deise = deiseData[0];
        console.log(`   ID: ${deise.id}`);
        console.log(`   Nome: ${deise.name}`);
        console.log(`   Email: ${deise.email}`);
        console.log(`   User ID: ${deise.user_id}`);
        console.log(`   Role: ${deise.role}`);
        console.log(`   Criado em: ${deise.created_at}`);
        
        if (!deise.user_id) {
          console.log('⚠️ PROBLEMA: user_id está null/undefined');
        }
        
        if (!deise.role) {
          console.log('⚠️ PROBLEMA: role está null/undefined');
        }
      }
    }
    
    // 5. Tentar habilitar RLS se não estiver habilitado
    console.log('\n5️⃣ Verificando se precisamos habilitar RLS...');
    
    try {
      const { data: enableResult, error: enableError } = await supabaseAdmin
        .rpc('sql', {
          query: `
            -- Verificar se RLS está habilitado
            SELECT 
              c.relrowsecurity as rls_enabled
            FROM pg_class c
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public' 
            AND c.relname = 'regional_activities';
          `
        });
      
      if (enableError) {
        console.log('❌ Erro ao verificar RLS:', enableError.message);
      } else if (enableResult && enableResult.length > 0) {
        const isEnabled = enableResult[0].rls_enabled;
        console.log(`   RLS está habilitado: ${isEnabled}`);
        
        if (!isEnabled) {
          console.log('🔧 Tentando habilitar RLS...');
          
          const { data: enableRLSResult, error: enableRLSError } = await supabaseAdmin
            .rpc('sql', {
              query: 'ALTER TABLE public.regional_activities ENABLE ROW LEVEL SECURITY;'
            });
          
          if (enableRLSError) {
            console.log('❌ Erro ao habilitar RLS:', enableRLSError.message);
          } else {
            console.log('✅ RLS habilitado com sucesso!');
          }
        }
      }
    } catch (error) {
      console.log('❌ Erro ao tentar habilitar RLS:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

investigateRLSIssue().catch(console.error);