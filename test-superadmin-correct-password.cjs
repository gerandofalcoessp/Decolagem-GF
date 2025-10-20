const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4005/api';

async function testSuperAdminPermissions() {
    console.log('🔐 Testando login com senha correta...');
    
    try {
        // 1. Login com senha correta
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'flavio.almeida@gerandofalcoes.com',
                password: '123456'
            })
        });

        const loginData = await loginResponse.json();
        console.log('📊 Login Response Status:', loginResponse.status);
        console.log('📊 Login Response:', loginData);

        if (!loginResponse.ok) {
            console.error('❌ Falha no login:', loginData);
            return;
        }

        const token = loginData.session?.access_token || loginData.access_token || loginData.token;
        if (!token) {
            console.error('❌ Token não encontrado na resposta');
            console.log('🔍 Estrutura da resposta:', JSON.stringify(loginData, null, 2));
            return;
        }

        console.log('✅ Login bem-sucedido! Token obtido.');

        // 2. Testar criação de usuário
        console.log('\n🔨 Testando criação de usuário...');
        const newUser = {
            nome: `Teste Super Admin ${Date.now()}`,
            email: `teste.superadmin.${Date.now()}@test.com`,
            password: 'TesteSenha123!', // Corrigido: era 'senha', agora é 'password'
            role: 'lider_regional',
            regional: 'SP'
        };

        const createResponse = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newUser)
        });

        const createData = await createResponse.json();
        console.log('📊 Create User Status:', createResponse.status);
        console.log('📊 Create User Response:', createData);

        if (createResponse.ok) {
            console.log('✅ Usuário criado com sucesso!');
            
            // 3. Listar usuários para verificar
            console.log('\n📋 Listando usuários...');
            const listResponse = await fetch(`${API_BASE}/auth/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const listData = await listResponse.json();
            console.log('📊 List Users Status:', listResponse.status);
            console.log('📊 List Users Response:', listData);
            
            if (listResponse.ok) {
                // Verificar se listData tem a propriedade users
                const users = listData.users || listData;
                const createdUser = Array.isArray(users) ? users.find(u => u.email === newUser.email) : null;
                if (createdUser) {
                    console.log('✅ Usuário encontrado na listagem:', createdUser);
                    
                    // 4. Testar exclusão do usuário criado
                    console.log('\n🗑️ Testando exclusão de usuário...');
                    const deleteResponse = await fetch(`${API_BASE}/auth/users/${createdUser.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    console.log('📊 Delete User Status:', deleteResponse.status);
                    
                    if (deleteResponse.ok) {
                        console.log('✅ Usuário excluído com sucesso!');
                    } else {
                        const deleteData = await deleteResponse.json();
                        console.log('❌ Erro ao excluir usuário:', deleteData);
                    }
                } else {
                    console.log('❌ Usuário criado não encontrado na listagem');
                }
            } else {
                console.log('❌ Erro ao listar usuários:', listData);
            }
        } else {
            console.log('❌ Erro ao criar usuário:', createData);
        }

        // 5. Verificar informações do usuário logado
        console.log('\n👤 Verificando informações do usuário logado...');
        const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('📊 Profile Data:', profileData);
        } else {
            console.log('❌ Erro ao obter perfil do usuário');
        }

    } catch (error) {
        console.error('💥 Erro durante o teste:', error.message);
    }
}

testSuperAdminPermissions();