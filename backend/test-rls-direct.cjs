const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testRLSDirect() {
    console.log('🔍 TESTE DIRETO DE RLS\n');
    
    // 1. Teste com Service Role (sem RLS)
    console.log('1. Testando com Service Role (sem RLS)...');
    const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: adminData, error: adminError } = await supabaseAdmin
        .from('regional_activities')
        .select('*')
        .eq('atividade_label', 'Famílias Embarcadas Decolagem');
        
    console.log(`   Service Role: ${adminError ? 'ERRO' : adminData.length + ' registros'}`);
    if (adminError) console.log(`     Erro: ${adminError.message}`);
    
    // 2. Teste com Anon Key (com RLS)
    console.log('\n2. Testando com Anon Key (com RLS)...');
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
    
    // 3. Teste simulando o endpoint exato
    console.log('\n3. Simulando o endpoint exato...');
    
    // Usar as mesmas credenciais do testar-auth-token.cjs que funcionou
    const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
        email: 'admin@decolagemgf.com.br',
        password: '123456'
    });
    
    if (loginError) {
        console.log('❌ Erro no login:', loginError.message);
        
        // Tentar criar um usuário de teste
        console.log('\n   Tentando criar usuário de teste...');
        const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            email: 'test@decolagem.org.br',
            password: 'Test123!',
            email_confirm: true
        });
        
        if (signUpError) {
            console.log('❌ Erro ao criar usuário:', signUpError.message);
            return;
        }
        
        console.log('✅ Usuário criado:', signUpData.user?.email);
        
        // Tentar login com o novo usuário
        const { data: newLoginData, error: newLoginError } = await supabaseAdmin.auth.signInWithPassword({
            email: 'test@decolagem.org.br',
            password: 'Test123!'
        });
        
        if (newLoginError) {
            console.log('❌ Erro no login com novo usuário:', newLoginError.message);
            return;
        }
        
        console.log('✅ Login realizado com novo usuário');
        
        // Usar o token do novo usuário
        const token = newLoginData.session?.access_token;
        
        if (!token) {
            console.log('❌ Token não encontrado');
            return;
        }
        
        // Criar cliente com token
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
        
        // Testar query
        const { data: userQueryData, error: userQueryError } = await supabaseUser
            .from('regional_activities')
            .select('*')
            .eq('atividade_label', 'Famílias Embarcadas Decolagem');
            
        console.log(`   Query com usuário: ${userQueryError ? 'ERRO' : userQueryData.length + ' registros'}`);
        if (userQueryError) {
            console.log(`     Erro: ${userQueryError.message}`);
        }
        
    } else {
        console.log('✅ Login realizado');
        
        const token = loginData.session?.access_token;
        
        if (!token) {
            console.log('❌ Token não encontrado');
            return;
        }
        
        // Criar cliente com token (igual ao endpoint)
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
        const { data: userQueryData, error: userQueryError } = await supabaseUser
            .from('regional_activities')
            .select('quantidade')
            .eq('atividade_label', 'Famílias Embarcadas Decolagem')
            .eq('status', 'ativo');
            
        console.log(`   Query com usuário: ${userQueryError ? 'ERRO' : userQueryData.length + ' registros'}`);
        if (userQueryError) {
            console.log(`     Erro: ${userQueryError.message}`);
        } else {
            const total = userQueryData.reduce((sum, item) => sum + (item.quantidade || 0), 0);
            console.log(`     Total: ${total}`);
        }
    }
}

testRLSDirect();