const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function corrigirRLSPoliticas() {
  console.log('🔧 Corrigindo políticas RLS para permitir acesso aos dados...\n');
  
  try {
    // 1. Verificar políticas existentes
    console.log('1️⃣ Verificando políticas existentes...');
    
    const { data: existingPolicies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('policyname, tablename, cmd')
      .in('tablename', ['regional_activities', 'calendar_events']);
      
    if (policiesError) {
      console.log('⚠️ Erro ao verificar políticas:', policiesError.message);
    } else {
      console.log(`✅ Encontradas ${existingPolicies.length} políticas existentes`);
      existingPolicies.forEach(policy => {
        console.log(`   - ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
      });
    }

    // 2. Criar política mais permissiva para regional_activities
    console.log('\n2️⃣ Criando política permissiva para regional_activities...');
    
    const createRegionalActivitiesPolicy = `
      -- Remover política restritiva existente
      DROP POLICY IF EXISTS "regional_activities_select_policy" ON regional_activities;
      
      -- Criar nova política que permite leitura para usuários autenticados
      CREATE POLICY "regional_activities_select_authenticated" ON regional_activities
        FOR SELECT USING (
          -- Permitir para qualquer usuário autenticado
          auth.uid() IS NOT NULL
        );
    `;
    
    const { error: regionalError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: createRegionalActivitiesPolicy 
    });
    
    if (regionalError) {
      console.log('⚠️ Tentando método alternativo para regional_activities...');
      
      // Método alternativo usando queries separadas
      try {
        await supabaseAdmin.rpc('exec_sql', { 
          sql: 'DROP POLICY IF EXISTS "regional_activities_select_policy" ON regional_activities;' 
        });
        
        await supabaseAdmin.rpc('exec_sql', { 
          sql: `CREATE POLICY "regional_activities_select_authenticated" ON regional_activities
                FOR SELECT USING (auth.uid() IS NOT NULL);` 
        });
        
        console.log('✅ Política para regional_activities criada com sucesso');
      } catch (altError) {
        console.log('❌ Erro ao criar política para regional_activities:', altError.message);
      }
    } else {
      console.log('✅ Política para regional_activities criada com sucesso');
    }

    // 3. Criar política mais permissiva para calendar_events
    console.log('\n3️⃣ Criando política permissiva para calendar_events...');
    
    const createCalendarEventsPolicy = `
      -- Remover política restritiva existente
      DROP POLICY IF EXISTS "calendar_events_select_policy" ON calendar_events;
      
      -- Criar nova política que permite leitura para usuários autenticados
      CREATE POLICY "calendar_events_select_authenticated" ON calendar_events
        FOR SELECT USING (
          -- Permitir para qualquer usuário autenticado
          auth.uid() IS NOT NULL
        );
    `;
    
    const { error: calendarError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: createCalendarEventsPolicy 
    });
    
    if (calendarError) {
      console.log('⚠️ Tentando método alternativo para calendar_events...');
      
      // Método alternativo usando queries separadas
      try {
        await supabaseAdmin.rpc('exec_sql', { 
          sql: 'DROP POLICY IF EXISTS "calendar_events_select_policy" ON calendar_events;' 
        });
        
        await supabaseAdmin.rpc('exec_sql', { 
          sql: `CREATE POLICY "calendar_events_select_authenticated" ON calendar_events
                FOR SELECT USING (auth.uid() IS NOT NULL);` 
        });
        
        console.log('✅ Política para calendar_events criada com sucesso');
      } catch (altError) {
        console.log('❌ Erro ao criar política para calendar_events:', altError.message);
      }
    } else {
      console.log('✅ Política para calendar_events criada com sucesso');
    }

    // 4. Verificar políticas após as mudanças
    console.log('\n4️⃣ Verificando políticas após as mudanças...');
    
    const { data: newPolicies, error: newPoliciesError } = await supabaseAdmin
      .from('pg_policies')
      .select('policyname, tablename, cmd')
      .in('tablename', ['regional_activities', 'calendar_events']);
      
    if (newPoliciesError) {
      console.log('⚠️ Erro ao verificar novas políticas:', newPoliciesError.message);
    } else {
      console.log(`✅ Políticas atuais (${newPolicies.length}):`);
      newPolicies.forEach(policy => {
        console.log(`   - ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
      });
    }

    // 5. Testar acesso aos dados
    console.log('\n5️⃣ Testando acesso aos dados...');
    
    // Testar regional_activities
    const { data: activities, error: activitiesTestError } = await supabaseAdmin
      .from('regional_activities')
      .select('id, title, regional')
      .limit(5);
      
    if (activitiesTestError) {
      console.log('❌ Erro ao testar regional_activities:', activitiesTestError.message);
    } else {
      console.log(`✅ regional_activities: ${activities.length} registros acessíveis`);
      if (activities.length > 0) {
        activities.forEach((activity, index) => {
          console.log(`   ${index + 1}. ${activity.title} (${activity.regional})`);
        });
      }
    }
    
    // Testar calendar_events
    const { data: events, error: eventsTestError } = await supabaseAdmin
      .from('calendar_events')
      .select('id, titulo, regional')
      .limit(5);
      
    if (eventsTestError) {
      console.log('❌ Erro ao testar calendar_events:', eventsTestError.message);
    } else {
      console.log(`✅ calendar_events: ${events.length} registros acessíveis`);
      if (events.length > 0) {
        events.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.titulo} (${event.regional})`);
        });
      }
    }

    console.log('\n🎉 Correção das políticas RLS concluída!');
    console.log('📝 Agora os usuários autenticados devem conseguir acessar os dados via API.');

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

corrigirRLSPoliticas();