const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugFamiliasEmbarcadas() {
    try {
        console.log('🔍 DEBUG: Investigando por que familiasEmbarcadas retorna 0...\n');
        
        // 1. Testar a query exata do endpoint
        console.log('1. Testando query EXATA do endpoint:');
        console.log('   Query: .from("regional_activities").select("quantidade").eq("atividade_label", "Famílias Embarcadas Decolagem").eq("status", "ativo")');
        
        const { data: endpointQuery, error: endpointError } = await supabase
            .from('regional_activities')
            .select('quantidade')
            .eq('atividade_label', 'Famílias Embarcadas Decolagem')
            .eq('status', 'ativo');
            
        if (endpointError) {
            console.log('❌ Erro na query do endpoint:', endpointError.message);
        } else {
            console.log(`✅ Query do endpoint retornou ${endpointQuery.length} registros`);
            if (endpointQuery.length > 0) {
                console.log('   Dados:', endpointQuery);
                const total = endpointQuery.reduce((sum, item) => sum + (parseInt(item.quantidade) || 0), 0);
                console.log(`   Total calculado: ${total}`);
            }
        }
        
        // 2. Testar query sem filtro de status
        console.log('\n2. Testando query SEM filtro de status:');
        console.log('   Query: .from("regional_activities").select("quantidade").eq("atividade_label", "Famílias Embarcadas Decolagem")');
        
        const { data: noStatusQuery, error: noStatusError } = await supabase
            .from('regional_activities')
            .select('quantidade')
            .eq('atividade_label', 'Famílias Embarcadas Decolagem');
            
        if (noStatusError) {
            console.log('❌ Erro na query sem status:', noStatusError.message);
        } else {
            console.log(`✅ Query sem status retornou ${noStatusQuery.length} registros`);
            if (noStatusQuery.length > 0) {
                console.log('   Dados:', noStatusQuery);
                const total = noStatusQuery.reduce((sum, item) => sum + (parseInt(item.quantidade) || 0), 0);
                console.log(`   Total calculado: ${total}`);
            }
        }
        
        // 3. Verificar todos os registros com atividade_label
        console.log('\n3. Verificando TODOS os registros com atividade_label:');
        console.log('   Query: .from("regional_activities").select("*").not("atividade_label", "is", null)');
        
        const { data: allLabels, error: allLabelsError } = await supabase
            .from('regional_activities')
            .select('atividade_label, quantidade, status')
            .not('atividade_label', 'is', null);
            
        if (allLabelsError) {
            console.log('❌ Erro ao buscar todos os labels:', allLabelsError.message);
        } else {
            console.log(`✅ Encontrados ${allLabels.length} registros com atividade_label`);
            
            // Agrupar por atividade_label
            const labelGroups = allLabels.reduce((acc, item) => {
                const label = item.atividade_label;
                if (!acc[label]) acc[label] = [];
                acc[label].push(item);
                return acc;
            }, {});
            
            console.log('\n   Labels encontrados:');
            Object.keys(labelGroups).forEach(label => {
                const items = labelGroups[label];
                const total = items.reduce((sum, item) => sum + (parseInt(item.quantidade) || 0), 0);
                console.log(`   - "${label}": ${items.length} registros, total: ${total}`);
                
                if (label.includes('Famílias') || label.includes('Decolagem')) {
                    console.log(`     Detalhes:`, items);
                }
            });
        }
        
        // 4. Verificar se existe algum registro com status 'ativo'
        console.log('\n4. Verificando registros com status "ativo":');
        
        const { data: activeRecords, error: activeError } = await supabase
            .from('regional_activities')
            .select('atividade_label, quantidade, status')
            .eq('status', 'ativo');
            
        if (activeError) {
            console.log('❌ Erro ao buscar registros ativos:', activeError.message);
        } else {
            console.log(`✅ Encontrados ${activeRecords.length} registros com status "ativo"`);
            if (activeRecords.length > 0) {
                console.log('   Primeiros 5 registros:', activeRecords.slice(0, 5));
            }
        }
        
    } catch (error) {
        console.error('❌ Erro no debug:', error.message);
    }
}

debugFamiliasEmbarcadas();