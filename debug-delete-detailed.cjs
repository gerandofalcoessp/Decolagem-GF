const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugDeleteDetailed() {
    console.log('🔍 Debug detalhado do problema de exclusão...\n');
    
    try {
        // 1. Criar um usuário diretamente no Supabase Auth
        console.log('1️⃣ Criando usuário diretamente no Supabase Auth...');
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: `debug.detailed.${Date.now()}@test.com`,
            password: 'Test123!',
            email_confirm: true,
            user_metadata: {
                nome: 'Debug Detailed User',
                role: 'membro'
            }
        });

        if (authError) {
            console.log('❌ Erro ao criar usuário no Auth:', authError);
            return;
        }

        console.log('✅ Usuário criado no Auth:', authUser.user.id);

        // 2. Inserir na tabela usuarios
        console.log('\n2️⃣ Inserindo na tabela usuarios...');
        const { data: usuarioData, error: usuarioError } = await supabaseAdmin
            .from('usuarios')
            .insert({
                auth_user_id: authUser.user.id,
                email: authUser.user.email,
                nome: 'Debug Detailed User',
                role: 'membro',
                tipo: 'membro',
                status: 'ativo'
            })
            .select('*')
            .single();

        if (usuarioError) {
            console.log('❌ Erro ao inserir na tabela usuarios:', usuarioError);
            return;
        }

        console.log('✅ Usuário inserido na tabela usuarios:');
        console.log('   - ID (tabela):', usuarioData.id);
        console.log('   - auth_user_id:', usuarioData.auth_user_id);
        console.log('   - Email:', usuarioData.email);

        // 3. Testar busca com diferentes métodos
        console.log('\n3️⃣ Testando buscas na tabela usuarios...');
        
        // Busca por ID da tabela (UUID)
        console.log('🔍 Buscando por ID da tabela (UUID):', usuarioData.id);
        const { data: searchById, error: searchByIdError } = await supabaseAdmin
            .from('usuarios')
            .select('id, auth_user_id')
            .eq('id', usuarioData.id)
            .single();

        if (searchByIdError) {
            console.log('❌ Erro na busca por ID:', searchByIdError);
        } else {
            console.log('✅ Encontrado por ID:', searchById);
        }

        // Busca por auth_user_id
        console.log('\n🔍 Buscando por auth_user_id:', usuarioData.auth_user_id);
        const { data: searchByAuthId, error: searchByAuthIdError } = await supabaseAdmin
            .from('usuarios')
            .select('id, auth_user_id')
            .eq('auth_user_id', usuarioData.auth_user_id)
            .single();

        if (searchByAuthIdError) {
            console.log('❌ Erro na busca por auth_user_id:', searchByAuthIdError);
        } else {
            console.log('✅ Encontrado por auth_user_id:', searchByAuthId);
        }

        // Busca com OR (como no código original)
        console.log('\n🔍 Buscando com OR (como no AuthService)...');
        const { data: searchByOr, error: searchByOrError } = await supabaseAdmin
            .from('usuarios')
            .select('id, auth_user_id')
            .or(`id.eq.${usuarioData.id},auth_user_id.eq.${usuarioData.id}`)
            .single();

        if (searchByOrError) {
            console.log('❌ Erro na busca com OR:', searchByOrError);
        } else {
            console.log('✅ Encontrado com OR:', searchByOr);
        }

        // 4. Testar exclusão manual
        console.log('\n4️⃣ Testando exclusão manual...');
        
        // Primeiro excluir do Auth
        console.log('🗑️ Excluindo do Supabase Auth...');
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(usuarioData.auth_user_id);
        if (deleteAuthError) {
            console.log('❌ Erro ao excluir do Auth:', deleteAuthError);
        } else {
            console.log('✅ Excluído do Auth com sucesso');
        }

        // Depois excluir da tabela usuarios
        console.log('\n🗑️ Excluindo da tabela usuarios...');
        const { data: deletedRows, error: deleteUsuarioError } = await supabaseAdmin
            .from('usuarios')
            .delete()
            .eq('id', usuarioData.id)
            .select('id');

        if (deleteUsuarioError) {
            console.log('❌ Erro ao excluir da tabela usuarios:', deleteUsuarioError);
        } else {
            console.log('✅ Excluído da tabela usuarios:', deletedRows);
        }

    } catch (error) {
        console.error('💥 Erro geral:', error);
    }
}

debugDeleteDetailed().catch(console.error);