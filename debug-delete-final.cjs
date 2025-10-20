const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugDeleteFinal() {
    console.log('🔍 Debug final do problema de exclusão...\n');
    
    try {
        // 1. Listar usuários existentes na tabela usuarios
        console.log('1️⃣ Listando usuários existentes na tabela usuarios...');
        const { data: usuarios, error: usuariosError } = await supabaseAdmin
            .from('usuarios')
            .select('id, auth_user_id, email, nome')
            .order('created_at', { ascending: false })
            .limit(5);

        if (usuariosError) {
            console.log('❌ Erro ao listar usuários:', usuariosError);
            return;
        }

        console.log(`✅ Encontrados ${usuarios.length} usuários:`);
        usuarios.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email}`);
            console.log(`      - ID (tabela): ${user.id}`);
            console.log(`      - auth_user_id: ${user.auth_user_id}`);
        });

        if (usuarios.length === 0) {
            console.log('❌ Nenhum usuário encontrado na tabela usuarios');
            return;
        }

        // 2. Pegar o último usuário criado (que não seja super admin)
        const testUser = usuarios.find(u => !u.email.includes('flavio.almeida') && !u.email.includes('leo.martins'));
        
        if (!testUser) {
            console.log('❌ Nenhum usuário de teste encontrado');
            return;
        }

        console.log(`\n2️⃣ Usando usuário de teste: ${testUser.email}`);
        console.log(`   - ID (tabela): ${testUser.id}`);
        console.log(`   - auth_user_id: ${testUser.auth_user_id}`);

        // 3. Testar diferentes métodos de busca
        console.log('\n3️⃣ Testando métodos de busca...');
        
        // Método 1: Busca por ID da tabela (UUID)
        console.log(`🔍 Método 1: Buscando por ID da tabela (${testUser.id})...`);
        const { data: searchById, error: searchByIdError } = await supabaseAdmin
            .from('usuarios')
            .select('id, auth_user_id')
            .eq('id', testUser.id)
            .single();

        if (searchByIdError) {
            console.log('❌ Erro na busca por ID:', searchByIdError);
        } else {
            console.log('✅ Encontrado por ID:', searchById);
        }

        // Método 2: Busca por auth_user_id
        console.log(`\n🔍 Método 2: Buscando por auth_user_id (${testUser.auth_user_id})...`);
        const { data: searchByAuthId, error: searchByAuthIdError } = await supabaseAdmin
            .from('usuarios')
            .select('id, auth_user_id')
            .eq('auth_user_id', testUser.auth_user_id)
            .single();

        if (searchByAuthIdError) {
            console.log('❌ Erro na busca por auth_user_id:', searchByAuthIdError);
        } else {
            console.log('✅ Encontrado por auth_user_id:', searchByAuthId);
        }

        // Método 3: Busca com OR (simulando o AuthService)
        console.log(`\n🔍 Método 3: Buscando com OR (ID da tabela)...`);
        const { data: searchByOr1, error: searchByOr1Error } = await supabaseAdmin
            .from('usuarios')
            .select('id, auth_user_id')
            .or(`id.eq.${testUser.id},auth_user_id.eq.${testUser.id}`)
            .single();

        if (searchByOr1Error) {
            console.log('❌ Erro na busca com OR (ID tabela):', searchByOr1Error);
        } else {
            console.log('✅ Encontrado com OR (ID tabela):', searchByOr1);
        }

        // Método 4: Busca com OR (simulando o AuthService com auth_user_id)
        console.log(`\n🔍 Método 4: Buscando com OR (auth_user_id)...`);
        const { data: searchByOr2, error: searchByOr2Error } = await supabaseAdmin
            .from('usuarios')
            .select('id, auth_user_id')
            .or(`id.eq.${testUser.auth_user_id},auth_user_id.eq.${testUser.auth_user_id}`)
            .single();

        if (searchByOr2Error) {
            console.log('❌ Erro na busca com OR (auth_user_id):', searchByOr2Error);
        } else {
            console.log('✅ Encontrado com OR (auth_user_id):', searchByOr2);
        }

        // 4. Testar exclusão manual (simulando o AuthService)
        console.log('\n4️⃣ Simulando lógica do AuthService.deleteUser...');
        
        const userId = testUser.id; // Usando o ID da tabela usuarios
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        console.log(`📋 userId recebido: ${userId}`);
        console.log(`📋 É UUID? ${uuidRegex.test(userId)}`);
        
        if (uuidRegex.test(userId)) {
            console.log('🔍 Executando lógica para UUID...');
            
            // Busca como no AuthService
            const { data: usuario, error: usuarioErr } = await supabaseAdmin
                .from('usuarios')
                .select('id, auth_user_id')
                .or(`id.eq.${userId},auth_user_id.eq.${userId}`)
                .single();

            if (usuarioErr) {
                console.log('❌ Erro na busca (como AuthService):', usuarioErr);
            } else {
                console.log('✅ Usuário encontrado (como AuthService):', usuario);
                
                // Testar exclusão da tabela usuarios
                console.log('\n🗑️ Testando exclusão da tabela usuarios...');
                const { data: deletedRows, error: deleteError } = await supabaseAdmin
                    .from('usuarios')
                    .delete()
                    .eq('id', userId)
                    .select('id');

                if (deleteError) {
                    console.log('❌ Erro na exclusão:', deleteError);
                } else {
                    console.log('✅ Exclusão bem-sucedida:', deletedRows);
                }
            }
        }

    } catch (error) {
        console.error('💥 Erro geral:', error);
    }
}

debugDeleteFinal().catch(console.error);