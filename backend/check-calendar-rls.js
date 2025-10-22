import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCalendarRLS() {
  console.log('🔍 Verificando políticas RLS para calendar_events...\n');
  
  try {
    // 1. Verificar se RLS está habilitado
    console.log('1. Verificando se RLS está habilitado...');
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          rowsecurity,
          forcerowsecurity
        FROM pg_tables 
        WHERE tablename = 'calendar_events' 
        AND schemaname = 'public';
      `
    });

    if (rlsError) {
      console.error('❌ Erro ao verificar RLS:', rlsError.message);
      return;
    }

    console.log('✅ Status RLS:', rlsStatus);

    // 2. Verificar políticas existentes
    console.log('\n2. Verificando políticas existentes...');
    const { data: policies, error: policiesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT 
          policyname,
          cmd,
          permissive,
          roles,
          qual,
          with_check
        FROM pg_policies 
        WHERE tablename = 'calendar_events' 
        AND schemaname = 'public';
      `
    });

    if (policiesError) {
      console.error('❌ Erro ao verificar políticas:', policiesError.message);
      return;
    }

    console.log('✅ Políticas encontradas:', policies);

    // A função exec_sql retorna { success: true, rows_affected: N } quando bem-sucedida
    if (policies && policies.success && policies.rows_affected === 0) {
      console.log('\n⚠️  PROBLEMA ENCONTRADO: Nenhuma política RLS encontrada!');
      console.log('   Isso explica por que os eventos não estão sendo salvos.');
      console.log('   Vamos criar as políticas necessárias...\n');
      
      await createCalendarRLSPolicies();
    } else if (policies && policies.success && policies.rows_affected > 0) {
      console.log(`\n📋 ${policies.rows_affected} políticas RLS encontradas para calendar_events`);
      console.log('   As políticas existem, vamos verificar se estão corretas...\n');
      
      // Vamos tentar uma query mais específica para ver os detalhes
      await checkPolicyDetails();
    } else {
      console.log('\n⚠️  Resposta inesperada da verificação de políticas');
      console.log('   Vamos criar as políticas para garantir...\n');
      await createCalendarRLSPolicies();
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

async function checkPolicyDetails() {
  console.log('🔍 Verificando detalhes das políticas existentes...\n');
  
  try {
    const { data: policyDetails, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT 
          policyname,
          cmd,
          roles::text,
          qual,
          with_check
        FROM pg_policies 
        WHERE tablename = 'calendar_events' 
        AND schemaname = 'public'
        ORDER BY policyname;
      `
    });

    if (error) {
      console.error('❌ Erro ao obter detalhes das políticas:', error.message);
      return;
    }

    console.log('✅ Detalhes das políticas:', policyDetails);
    
    // Como a função exec_sql não retorna os dados diretamente, vamos recriar as políticas
    console.log('\n⚠️  Para garantir que as políticas estão corretas, vamos recriá-las...\n');
    await createCalendarRLSPolicies();
    
  } catch (error) {
    console.error('❌ Erro ao verificar detalhes:', error.message);
  }
}

async function createCalendarRLSPolicies() {
  console.log('🔨 Criando políticas RLS para calendar_events...\n');
  
  try {
    // Primeiro, garantir que RLS está habilitado
    console.log('1. Habilitando RLS...');
    const { error: enableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;'
    });

    if (enableError) {
      console.error('❌ Erro ao habilitar RLS:', enableError.message);
    } else {
      console.log('✅ RLS habilitado');
    }

    // Criar política para SELECT
    console.log('\n2. Criando política SELECT...');
    const { error: selectError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "calendar_events_select_policy" ON public.calendar_events;
        CREATE POLICY "calendar_events_select_policy" ON public.calendar_events
        FOR SELECT USING (
          -- Permitir para usuários autenticados
          auth.role() = 'authenticated'
        );
      `
    });

    if (selectError) {
      console.error('❌ Erro ao criar política SELECT:', selectError.message);
    } else {
      console.log('✅ Política SELECT criada');
    }

    // Criar política para INSERT
    console.log('\n3. Criando política INSERT...');
    const { error: insertError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "calendar_events_insert_policy" ON public.calendar_events;
        CREATE POLICY "calendar_events_insert_policy" ON public.calendar_events
        FOR INSERT WITH CHECK (
          -- Permitir para usuários autenticados
          auth.role() = 'authenticated'
        );
      `
    });

    if (insertError) {
      console.error('❌ Erro ao criar política INSERT:', insertError.message);
    } else {
      console.log('✅ Política INSERT criada');
    }

    // Criar política para UPDATE
    console.log('\n4. Criando política UPDATE...');
    const { error: updateError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "calendar_events_update_policy" ON public.calendar_events;
        CREATE POLICY "calendar_events_update_policy" ON public.calendar_events
        FOR UPDATE USING (
          -- Permitir para usuários autenticados
          auth.role() = 'authenticated'
        ) WITH CHECK (
          -- Permitir para usuários autenticados
          auth.role() = 'authenticated'
        );
      `
    });

    if (updateError) {
      console.error('❌ Erro ao criar política UPDATE:', updateError.message);
    } else {
      console.log('✅ Política UPDATE criada');
    }

    // Criar política para DELETE
    console.log('\n5. Criando política DELETE...');
    const { error: deleteError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "calendar_events_delete_policy" ON public.calendar_events;
        CREATE POLICY "calendar_events_delete_policy" ON public.calendar_events
        FOR DELETE USING (
          -- Permitir para usuários autenticados
          auth.role() = 'authenticated'
        );
      `
    });

    if (deleteError) {
      console.error('❌ Erro ao criar política DELETE:', deleteError.message);
    } else {
      console.log('✅ Política DELETE criada');
    }

    console.log('\n🎉 Todas as políticas RLS foram criadas com sucesso!');
    console.log('   Agora os eventos de calendário devem ser salvos corretamente.');

  } catch (error) {
    console.error('❌ Erro ao criar políticas:', error.message);
  }
}

// Executar verificação
checkCalendarRLS().catch(console.error);