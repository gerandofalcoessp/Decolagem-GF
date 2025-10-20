const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
    console.log('🔍 Verificando políticas RLS da tabela usuarios...\n');
    
    try {
        // 1. Listar políticas RLS
        console.log('1️⃣ Listando políticas RLS...');
        const { data: policies, error: policiesError } = await supabaseAdmin
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'usuarios');

        if (policiesError) {
            console.log('❌ Erro ao listar políticas:', policiesError);
        } else {
            console.log(`✅ Encontradas ${policies.length} políticas:`);
            policies.forEach((policy, index) => {
                console.log(`\n   Política ${index + 1}:`);
                console.log(`   - Nome: ${policy.policyname}`);
                console.log(`   - Comando: ${policy.cmd}`);
                console.log(`   - Roles: ${policy.roles}`);
                console.log(`   - Qual: ${policy.qual}`);
                console.log(`   - With Check: ${policy.with_check}`);
            });
        }

        // 2. Verificar políticas específicas para DELETE
        console.log('\n2️⃣ Verificando políticas específicas para DELETE...');
        const deletePolicies = policies?.filter(p => p.cmd === 'DELETE' || p.cmd === 'ALL');
        
        if (deletePolicies && deletePolicies.length > 0) {
            console.log(`✅ Encontradas ${deletePolicies.length} políticas para DELETE:`);
            deletePolicies.forEach((policy, index) => {
                console.log(`\n   DELETE Política ${index + 1}:`);
                console.log(`   - Nome: ${policy.policyname}`);
                console.log(`   - Roles: ${policy.roles}`);
                console.log(`   - Condição: ${policy.qual}`);
            });
        } else {
            console.log('❌ Nenhuma política DELETE encontrada');
        }

        // 3. Testar exclusão com usuário autenticado (simulando o contexto do AuthService)
        console.log('\n3️⃣ Testando exclusão com contexto de usuário autenticado...');
        
        // Login como super admin
        const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
            email: 'flavio.almeida@gerandofalcoes.com',
            password: '123456'
        });

        if (loginError) {
            console.log('❌ Erro no login:', loginError);
            return;
        }

        console.log('✅ Login bem-sucedido como super admin');

        // Criar cliente com token do usuário autenticado
        const supabaseUser = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Definir a sessão
        await supabaseUser.auth.setSession({
            access_token: loginData.session.access_token,
            refresh_token: loginData.session.refresh_token
        });

        // Listar usuários para pegar um de teste
        const { data: usuarios, error: usuariosError } = await supabaseUser
            .from('usuarios')
            .select('id, email')
            .neq('email', 'flavio.almeida@gerandofalcoes.com')
            .limit(1);

        if (usuariosError) {
            console.log('❌ Erro ao listar usuários com contexto autenticado:', usuariosError);
            return;
        }

        if (usuarios.length === 0) {
            console.log('❌ Nenhum usuário de teste encontrado');
            return;
        }

        const testUser = usuarios[0];
        console.log(`🎯 Tentando excluir usuário: ${testUser.email} (ID: ${testUser.id})`);

        // Tentar exclusão com contexto autenticado
        const { data: deleteResult, error: deleteError } = await supabaseUser
            .from('usuarios')
            .delete()
            .eq('id', testUser.id)
            .select('id');

        if (deleteError) {
            console.log('❌ Erro na exclusão com contexto autenticado:', deleteError);
        } else {
            console.log('✅ Exclusão bem-sucedida com contexto autenticado:', deleteResult);
        }

    } catch (error) {
        console.error('💥 Erro geral:', error);
    }
}

checkRLSPolicies().catch(console.error);