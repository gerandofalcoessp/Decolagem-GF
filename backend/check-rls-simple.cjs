const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkRLSSimple() {
    const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        console.log('🔍 VERIFICANDO RLS - MÉTODO SIMPLES\n');
        
        // 1. Verificar se RLS está habilitado na tabela
        console.log('1. Verificando se RLS está habilitado...');
        const { data: rlsData, error: rlsError } = await supabaseAdmin
            .rpc('sql', {
                query: `
                    SELECT 
                        schemaname,
                        tablename,
                        rowsecurity
                    FROM pg_tables 
                    WHERE tablename = 'regional_activities'
                `
            });
            
        if (rlsError) {
            console.log('❌ Erro ao verificar RLS:', rlsError.message);
        } else {
            console.log('✅ Status da tabela:', rlsData);
        }
        
        // 2. Listar políticas RLS usando SQL direto
        console.log('\n2. Listando políticas RLS...');
        const { data: policies, error: policiesError } = await supabaseAdmin
            .rpc('sql', {
                query: `
                    SELECT 
                        policyname,
                        cmd,
                        permissive,
                        roles,
                        qual
                    FROM pg_policies 
                    WHERE tablename = 'regional_activities'
                `
            });
            
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
        
        // 3. Verificar o usuário atual no contexto autenticado
        console.log('3. Testando com usuário autenticado...');
        
        // Fazer login para obter token
        const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
            email: 'admin@decolagemgf.com.br',
            password: 'admin123'
        });
        
        if (loginError) {
            console.log('❌ Erro no login:', loginError.message);
            return;
        }
        
        const token = loginData.session?.access_token;
        console.log('✅ Login realizado, token obtido');
        
        // Criar cliente com token do usuário
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
        
        // Verificar dados do usuário atual
        const { data: userData, error: userError } = await supabaseUser.auth.getUser();
        if (userError) {
            console.log('❌ Erro ao obter usuário:', userError.message);
        } else {
            console.log('✅ Usuário autenticado:', userData.user?.email);
            console.log('   ID:', userData.user?.id);
        }
        
        // Testar query com usuário autenticado
        const { data: userQueryData, error: userQueryError } = await supabaseUser
            .from('regional_activities')
            .select('*')
            .eq('atividade_label', 'Famílias Embarcadas Decolagem');
            
        console.log(`   Query resultado: ${userQueryError ? 'ERRO' : userQueryData.length + ' registros'}`);
        if (userQueryError) {
            console.log(`     Erro: ${userQueryError.message}`);
        }
        
    } catch (error) {
        console.error('❌ Erro no script:', error.message);
    }
}

checkRLSSimple();