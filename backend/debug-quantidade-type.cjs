const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugQuantidadeType() {
    const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        console.log('🔍 DEBUGANDO TIPO DO CAMPO quantidade\n');
        
        // Buscar os dados completos
        const { data: queryData, error: queryError } = await supabaseAdmin
            .from('regional_activities')
            .select('*')
            .eq('atividade_label', 'Famílias Embarcadas Decolagem')
            .eq('status', 'ativo');
            
        if (queryError) {
            console.log('❌ Erro na query:', queryError.message);
            return;
        }
        
        console.log(`✅ Encontrados ${queryData.length} registros:`);
        console.log('');
        
        queryData.forEach((item, index) => {
            console.log(`${index + 1}. ID: ${item.id}`);
            console.log(`   Quantidade: ${item.quantidade} (tipo: ${typeof item.quantidade})`);
            console.log(`   Atividade: ${item.atividade_label}`);
            console.log(`   Status: ${item.status}`);
            console.log(`   Regional: ${item.regional}`);
            console.log('');
        });
        
        // Testar diferentes formas de somar
        console.log('🧮 TESTANDO DIFERENTES FORMAS DE SOMAR:\n');
        
        // 1. Soma simples (atual)
        const somaSimples = queryData.reduce((sum, item) => sum + (item.quantidade || 0), 0);
        console.log(`1. Soma simples: ${somaSimples}`);
        
        // 2. Conversão para número
        const somaComConversao = queryData.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0);
        console.log(`2. Soma com Number(): ${somaComConversao}`);
        
        // 3. Conversão para inteiro
        const somaComParseInt = queryData.reduce((sum, item) => sum + (parseInt(item.quantidade) || 0), 0);
        console.log(`3. Soma com parseInt(): ${somaComParseInt}`);
        
        // 4. Conversão para float
        const somaComParseFloat = queryData.reduce((sum, item) => sum + (parseFloat(item.quantidade) || 0), 0);
        console.log(`4. Soma com parseFloat(): ${somaComParseFloat}`);
        
        // 5. Verificar se é string e converter
        const somaStringToNumber = queryData.reduce((sum, item) => {
            const valor = typeof item.quantidade === 'string' ? Number(item.quantidade) : item.quantidade;
            return sum + (valor || 0);
        }, 0);
        console.log(`5. Soma verificando string: ${somaStringToNumber}`);
        
        // Verificar o tipo de dados na base
        console.log('\n📊 VERIFICANDO TIPO NA BASE DE DADOS:\n');
        
        const { data: typeData, error: typeError } = await supabaseAdmin
            .rpc('exec_sql', {
                sql: `
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default
                    FROM information_schema.columns 
                    WHERE table_name = 'regional_activities' 
                    AND column_name = 'quantidade'
                `
            });
            
        if (typeError) {
            console.log('❌ Erro ao verificar tipo:', typeError.message);
        } else {
            console.log('✅ Informações do campo quantidade:');
            console.log(typeData);
        }
        
    } catch (error) {
        console.error('❌ Erro no script:', error.message);
    }
}

debugQuantidadeType();