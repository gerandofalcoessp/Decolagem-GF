const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkRLSRegionalActivities() {
    const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        console.log('🔍 VERIFICANDO RLS NA TABELA regional_activities\n');
        
        // 1. Verificar se RLS está habilitado
        console.log('1. Verificando se RLS está habilitado...');
        const { data: rlsStatus, error: rlsError } = await supabaseAdmin
            .rpc('check_table_rls_status', { table_name: 'regional_activities' });
            
        if (rlsError) {
            console.log('⚠️  Não foi possível verificar status RLS:', rlsError.message);
        } else {
            console.log('✅ Status RLS:', rlsStatus ? 'HABILITADO' : 'DESABILITADO');
        }
        
        // 2. Listar políticas RLS
        console.log('\n2. Listando políticas RLS...');
        const { data: policies, error: policiesError } = await supabaseAdmin
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'regional_activities');
            
        if (policiesError) {
            console.log('❌ Erro ao buscar políticas:', policiesError.message);
        } else {
            console.log(`✅ Encontradas ${policies.length} políticas:`);
            policies.forEach((policy, index) => {
                console.log(`   ${index + 1}. ${policy.policyname} (${policy.cmd})`);
                console.log(`      Roles: ${policy.roles}`);
                console.log(`      Qual: ${policy.qual}`);
                console.log('');
            });
        }
        
        // 3. Verificar permissões da tabela
        console.log('3. Verificando permissões da tabela...');
        const { data: permissions, error: permError } = await supabaseAdmin
            .rpc('get_table_permissions', { table_name: 'regional_activities' });
            
        if (permError) {
            console.log('⚠️  Não foi possível verificar permissões:', permError.message);
        } else {
            console.log('✅ Permissões:', permissions);
        }
        
        // 4. Testar acesso direto com diferentes contextos
        console.log('\n4. Testando acesso com diferentes contextos...');
        
        // Service Role (sem RLS)
        const { data: serviceData, error: serviceError } = await supabaseAdmin
            .from('regional_activities')
            .select('*')
            .eq('atividade_label', 'Famílias Embarcadas Decolagem');
            
        console.log(`   Service Role: ${serviceError ? 'ERRO' : serviceData.length + ' registros'}`);
        if (serviceError) console.log(`     Erro: ${serviceError.message}`);
        
        // Anon Key (com RLS)
        const supabaseAnon = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        const { data: anonData, error: anonError } = await supabaseAnon
            .from('regional_activities')
            .select('*')
            .eq('atividade_label', 'Famílias Embarcadas Decolagem');
            
        console.log(`   Anon Key: ${anonError ? 'ERRO' : anonData.length + ' registros'}`);
        if (anonError) console.log(`     Erro: ${anonError.message}`);
        
    } catch (error) {
        console.error('❌ Erro no script:', error.message);
    }
}

checkRLSRegionalActivities();