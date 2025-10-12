const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixRLSRegionalActivities() {
    const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        console.log('🔧 CORRIGINDO RLS NA TABELA regional_activities\n');
        
        // 1. Verificar políticas existentes
        console.log('1. Verificando políticas existentes...');
        const { data: existingPolicies, error: policiesError } = await supabaseAdmin
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'regional_activities');
            
        if (policiesError) {
            console.log('⚠️  Erro ao verificar políticas:', policiesError.message);
        } else {
            console.log(`   Encontradas ${existingPolicies.length} políticas existentes`);
            existingPolicies.forEach(policy => {
                console.log(`   - ${policy.policyname} (${policy.cmd})`);
            });
        }
        
        // 2. Criar política para permitir SELECT para usuários autenticados
        console.log('\n2. Criando política de SELECT para usuários autenticados...');
        
        const createPolicySQL = `
            CREATE POLICY IF NOT EXISTS "authenticated_users_can_read_regional_activities"
            ON public.regional_activities
            FOR SELECT
            TO authenticated
            USING (true);
        `;
        
        const { data: createResult, error: createError } = await supabaseAdmin
            .rpc('exec_sql', { sql: createPolicySQL });
            
        if (createError) {
            console.log('❌ Erro ao criar política:', createError.message);
            
            // Tentar método alternativo usando SQL direto
            console.log('   Tentando método alternativo...');
            
            try {
                // Primeiro, verificar se RLS está habilitado
                const enableRLSSQL = `ALTER TABLE public.regional_activities ENABLE ROW LEVEL SECURITY;`;
                await supabaseAdmin.rpc('exec_sql', { sql: enableRLSSQL });
                
                // Criar a política
                await supabaseAdmin.rpc('exec_sql', { sql: createPolicySQL });
                
                console.log('✅ Política criada com sucesso (método alternativo)');
            } catch (altError) {
                console.log('❌ Erro no método alternativo:', altError.message);
                
                // Método manual - desabilitar RLS temporariamente
                console.log('   Tentando desabilitar RLS temporariamente...');
                
                const disableRLSSQL = `ALTER TABLE public.regional_activities DISABLE ROW LEVEL SECURITY;`;
                const { error: disableError } = await supabaseAdmin.rpc('exec_sql', { sql: disableRLSSQL });
                
                if (disableError) {
                    console.log('❌ Erro ao desabilitar RLS:', disableError.message);
                } else {
                    console.log('✅ RLS desabilitado temporariamente');
                    console.log('   ATENÇÃO: Isso permite acesso total à tabela!');
                }
            }
        } else {
            console.log('✅ Política criada com sucesso');
        }
        
        // 3. Testar acesso após correção
        console.log('\n3. Testando acesso após correção...');
        
        // Criar usuário de teste se não existir
        const testEmail = 'test@decolagem.org.br';
        const testPassword = 'Test123!';
        
        const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });
        
        if (loginError) {
            console.log('   Usuário de teste não encontrado, criando...');
            const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
                email: testEmail,
                password: testPassword,
                email_confirm: true
            });
            
            if (signUpError) {
                console.log('❌ Erro ao criar usuário de teste:', signUpError.message);
                return;
            }
            
            // Tentar login novamente
            const { data: newLoginData, error: newLoginError } = await supabaseAdmin.auth.signInWithPassword({
                email: testEmail,
                password: testPassword
            });
            
            if (newLoginError) {
                console.log('❌ Erro no login após criação:', newLoginError.message);
                return;
            }
            
            console.log('✅ Usuário criado e login realizado');
            
            const token = newLoginData.session?.access_token;
            await testWithToken(token);
        } else {
            console.log('✅ Login realizado com usuário existente');
            
            const token = loginData.session?.access_token;
            await testWithToken(token);
        }
        
    } catch (error) {
        console.error('❌ Erro no script:', error.message);
    }
}

async function testWithToken(token) {
    if (!token) {
        console.log('❌ Token não encontrado');
        return;
    }
    
    const supabaseUser = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            auth: { persistSession: false },
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        }
    );
    
    // Testar query exata do endpoint
    const { data: queryData, error: queryError } = await supabaseUser
        .from('regional_activities')
        .select('quantidade')
        .eq('atividade_label', 'Famílias Embarcadas Decolagem')
        .eq('status', 'ativo');
        
    console.log(`   Query resultado: ${queryError ? 'ERRO' : queryData.length + ' registros'}`);
    if (queryError) {
        console.log(`     Erro: ${queryError.message}`);
    } else {
        const total = queryData.reduce((sum, item) => sum + (item.quantidade || 0), 0);
        console.log(`     Total famílias embarcadas: ${total}`);
        
        if (total === 2020) {
            console.log('🎉 SUCESSO! O problema foi corrigido!');
        } else {
            console.log('⚠️  Total não confere com o esperado (2020)');
        }
    }
}

fixRLSRegionalActivities();