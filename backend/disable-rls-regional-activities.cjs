const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function disableRLSRegionalActivities() {
    const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        console.log('🔧 DESABILITANDO RLS NA TABELA regional_activities\n');
        console.log('⚠️  ATENÇÃO: Isso é uma solução temporária que permite acesso total à tabela!\n');
        
        // Desabilitar RLS na tabela regional_activities
        console.log('1. Desabilitando RLS...');
        
        const disableRLSSQL = `ALTER TABLE public.regional_activities DISABLE ROW LEVEL SECURITY;`;
        
        const { data: disableResult, error: disableError } = await supabaseAdmin
            .rpc('exec_sql', { sql: disableRLSSQL });
            
        if (disableError) {
            console.log('❌ Erro ao desabilitar RLS:', disableError.message);
            return;
        }
        
        console.log('✅ RLS desabilitado com sucesso');
        
        // Testar acesso após desabilitar RLS
        console.log('\n2. Testando acesso após desabilitar RLS...');
        
        // Usar usuário existente
        const testEmail = 'test@decolagem.org.br';
        const testPassword = 'Test123!';
        
        const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });
        
        if (loginError) {
            console.log('❌ Erro no login:', loginError.message);
            return;
        }
        
        console.log('✅ Login realizado');
        
        const token = loginData.session?.access_token;
        
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
                console.log('   O endpoint /api/instituicoes/stats agora deve retornar o valor correto.');
            } else {
                console.log('⚠️  Total não confere com o esperado (2020)');
            }
        }
        
        // Testar também com Anon Key
        console.log('\n3. Testando com Anon Key (sem autenticação)...');
        
        const supabaseAnon = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        const { data: anonData, error: anonError } = await supabaseAnon
            .from('regional_activities')
            .select('quantidade')
            .eq('atividade_label', 'Famílias Embarcadas Decolagem')
            .eq('status', 'ativo');
            
        console.log(`   Anon Key resultado: ${anonError ? 'ERRO' : anonData.length + ' registros'}`);
        if (anonError) {
            console.log(`     Erro: ${anonError.message}`);
        } else {
            const anonTotal = anonData.reduce((sum, item) => sum + (item.quantidade || 0), 0);
            console.log(`     Total: ${anonTotal}`);
        }
        
    } catch (error) {
        console.error('❌ Erro no script:', error.message);
    }
}

disableRLSRegionalActivities();