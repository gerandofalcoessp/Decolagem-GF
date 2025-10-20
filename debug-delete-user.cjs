const fetch = require('node-fetch');
require('dotenv').config();

const API_BASE = 'http://localhost:4000/api';

async function debugDeleteUser() {
    console.log('🔍 Debugando problema de exclusão de usuário...\n');
    
    try {
        // 1. Login com super admin
        console.log('1️⃣ Fazendo login com super admin...');
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'flavio.almeida@gerandofalcoes.com',
                password: '123456'
            })
        });

        if (!loginResponse.ok) {
            console.log('❌ Erro no login:', await loginResponse.text());
            return;
        }

        const loginData = await loginResponse.json();
        const token = loginData.session?.access_token;
        
        if (!token) {
            console.log('❌ Token não encontrado na resposta');
            return;
        }

        console.log('✅ Login realizado com sucesso');

        // 2. Criar um usuário para testar
        console.log('\n2️⃣ Criando usuário para teste...');
        const createResponse = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: `debug.test.${Date.now()}@test.com`,
                password: 'Test123!',
                nome: 'Debug Test User',
                role: 'membro'
            })
        });

        if (!createResponse.ok) {
            console.log('❌ Erro ao criar usuário:', await createResponse.text());
            return;
        }

        const createData = await createResponse.json();
        console.log('✅ Usuário criado:', createData);

        // 3. Listar usuários para encontrar o criado
        console.log('\n3️⃣ Listando usuários para encontrar o criado...');
        const listResponse = await fetch(`${API_BASE}/auth/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!listResponse.ok) {
            console.log('❌ Erro ao listar usuários:', await listResponse.text());
            return;
        }

        const listData = await listResponse.json();
        console.log('📊 Total de usuários:', listData.users?.length || 0);

        // Encontrar o usuário criado
        const createdUser = listData.users?.find(u => u.email === createData.user?.email);
        if (!createdUser) {
            console.log('❌ Usuário criado não encontrado na listagem');
            return;
        }

        console.log('✅ Usuário encontrado na listagem:');
        console.log('   - ID (tabela usuarios):', createdUser.id);
        console.log('   - auth_user_id:', createdUser.auth_user_id);
        console.log('   - Email:', createdUser.email);

        // 4. Testar exclusão com diferentes IDs
        console.log('\n4️⃣ Testando exclusão com ID da tabela usuarios...');
        let deleteResponse = await fetch(`${API_BASE}/auth/users/${createdUser.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📊 Status da exclusão (ID tabela):', deleteResponse.status);
        
        if (deleteResponse.ok) {
            console.log('✅ Usuário excluído com sucesso usando ID da tabela!');
        } else {
            const deleteError = await deleteResponse.text();
            console.log('❌ Erro ao excluir com ID da tabela:', deleteError);
            
            // 5. Tentar com auth_user_id se o primeiro falhou
            console.log('\n5️⃣ Testando exclusão com auth_user_id...');
            deleteResponse = await fetch(`${API_BASE}/auth/users/${createdUser.auth_user_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📊 Status da exclusão (auth_user_id):', deleteResponse.status);
            
            if (deleteResponse.ok) {
                console.log('✅ Usuário excluído com sucesso usando auth_user_id!');
            } else {
                const deleteError2 = await deleteResponse.text();
                console.log('❌ Erro ao excluir com auth_user_id:', deleteError2);
            }
        }

    } catch (error) {
        console.error('💥 Erro geral:', error);
    }
}

debugDeleteUser().catch(console.error);