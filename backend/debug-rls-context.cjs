const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugRLSContext() {
    const fetch = (await import('node-fetch')).default;
    
    try {
        console.log('🔍 DEBUG: Testando contexto RLS vs Service Role...\n');
        
        // 1. Testar com Service Role (sem RLS)
        console.log('1. Testando com SERVICE ROLE (sem RLS):');
        const supabaseService = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        const { data: serviceData, error: serviceError } = await supabaseService
            .from('regional_activities')
            .select('quantidade')
            .eq('atividade_label', 'Famílias Embarcadas Decolagem')
            .eq('status', 'ativo');
            
        if (serviceError) {
            console.log('❌ Erro com Service Role:', serviceError.message);
        } else {
            console.log(`✅ Service Role retornou ${serviceData.length} registros`);
            const total = serviceData.reduce((sum, item) => sum + (parseInt(item.quantidade) || 0), 0);
            console.log(`   Total: ${total}`);
        }
        
        // 2. Testar com usuário autenticado (com RLS)
        console.log('\n2. Testando com USUÁRIO AUTENTICADO (com RLS):');
        
        // Fazer login para obter token
        const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@decolagem.com',
                password: 'admin123'
            })
        });
        
        if (!loginResponse.ok) {
            console.log('❌ Erro no login:', loginResponse.status);
            return;
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.session?.access_token;
        
        if (!token) {
            console.log('❌ Token não encontrado no login');
            return;
        }
        
        console.log('✅ Login realizado com sucesso');
        
        // Criar cliente com token do usuário
        const supabaseUser = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        );
        
        const { data: userData, error: userError } = await supabaseUser
            .from('regional_activities')
            .select('quantidade')
            .eq('atividade_label', 'Famílias Embarcadas Decolagem')
            .eq('status', 'ativo');
            
        if (userError) {
            console.log('❌ Erro com usuário autenticado:', userError.message);
        } else {
            console.log(`✅ Usuário autenticado retornou ${userData.length} registros`);
            const total = userData.reduce((sum, item) => sum + (parseInt(item.quantidade) || 0), 0);
            console.log(`   Total: ${total}`);
        }
        
        // 3. Testar endpoint HTTP diretamente
        console.log('\n3. Testando ENDPOINT HTTP diretamente:');
        
        const statsResponse = await fetch('http://localhost:4000/api/instituicoes/stats', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!statsResponse.ok) {
            console.log('❌ Erro no endpoint:', statsResponse.status);
        } else {
            const statsData = await statsResponse.json();
            console.log('✅ Endpoint respondeu com sucesso');
            console.log('   familiasEmbarcadas:', statsData.data?.resumo?.familiasEmbarcadas);
            console.log('   Dados completos:', JSON.stringify(statsData.data?.resumo, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Erro no debug RLS:', error.message);
    }
}

debugRLSContext();