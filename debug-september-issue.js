// Use native fetch in Node.js 18+
const fetch = globalThis.fetch || require('node-fetch');

const API_BASE = 'http://localhost:4000/api';

async function debugSeptemberIssue() {
    console.log('🔍 Investigando problema do filtro de setembro...\n');
    
    try {
        // 1. Buscar todas as atividades regionais
        console.log('1. Buscando atividades regionais...');
        const activitiesResponse = await fetch(`${API_BASE}/atividades-regionais`);
        const allActivities = await activitiesResponse.json();
        
        console.log(`📊 Total de atividades: ${allActivities.length}`);
        
        // 2. Filtrar atividades de setembro
        console.log('\n2. Filtrando atividades de setembro...');
        const septemberActivities = allActivities.filter(activity => {
            let mesMatch = false;
            
            // Verificar activity_date (principal campo usado)
            if (activity.activity_date) {
                const date = new Date(activity.activity_date);
                if (!isNaN(date.getTime())) {
                    const mes = (date.getMonth() + 1).toString();
                    mesMatch = '9' === mes;
                    console.log(`   Atividade: ${activity.activity_date} -> Mês: ${mes}, Match: ${mesMatch}`);
                }
            } 
            // Fallback para data_inicio
            else if (activity.data_inicio) {
                const date = new Date(activity.data_inicio);
                if (!isNaN(date.getTime())) {
                    const mes = (date.getMonth() + 1).toString();
                    mesMatch = '9' === mes;
                    console.log(`   Atividade (data_inicio): ${activity.data_inicio} -> Mês: ${mes}, Match: ${mesMatch}`);
                }
            } 
            // Fallback para created_at
            else if (activity.created_at) {
                const date = new Date(activity.created_at);
                if (!isNaN(date.getTime())) {
                    const mes = (date.getMonth() + 1).toString();
                    mesMatch = '9' === mes;
                    console.log(`   Atividade (created_at): ${activity.created_at} -> Mês: ${mes}, Match: ${mesMatch}`);
                }
            }
            
            return mesMatch;
        });
        
        console.log(`📅 Atividades de setembro encontradas: ${septemberActivities.length}`);
        
        if (septemberActivities.length > 0) {
            console.log('\n   Detalhes das atividades de setembro:');
            septemberActivities.forEach((activity, i) => {
                console.log(`   ${i+1}. ${activity.atividade_label || activity.titulo || 'Sem título'}`);
                console.log(`      Data: ${activity.activity_date || activity.data_inicio || activity.created_at}`);
                console.log(`      Regional: ${activity.regional}`);
                console.log(`      Status: ${activity.status}`);
                console.log(`      Quantidade: ${activity.quantidade}`);
            });
        }
        
        // 3. Buscar todas as metas
        console.log('\n3. Buscando metas...');
        const metasResponse = await fetch(`${API_BASE}/metas`);
        const allMetas = await metasResponse.json();
        
        console.log(`📊 Total de metas: ${allMetas.length}`);
        
        // 4. Filtrar metas de setembro (se houver)
        console.log('\n4. Filtrando metas de setembro...');
        const septemberMetas = allMetas.filter(meta => {
            let mesMatch = false;
            
            if (meta.dataInicio) {
                const date = new Date(meta.dataInicio);
                if (!isNaN(date.getTime())) {
                    const mes = (date.getMonth() + 1).toString();
                    mesMatch = '9' === mes;
                    console.log(`   Meta (dataInicio): ${meta.dataInicio} -> Mês: ${mes}, Match: ${mesMatch}`);
                }
            } else if (meta.data_inicio) {
                const date = new Date(meta.data_inicio);
                if (!isNaN(date.getTime())) {
                    const mes = (date.getMonth() + 1).toString();
                    mesMatch = '9' === mes;
                    console.log(`   Meta (data_inicio): ${meta.data_inicio} -> Mês: ${mes}, Match: ${mesMatch}`);
                }
            } else if (meta.created_at) {
                const date = new Date(meta.created_at);
                if (!isNaN(date.getTime())) {
                    const mes = (date.getMonth() + 1).toString();
                    mesMatch = '9' === mes;
                    console.log(`   Meta (created_at): ${meta.created_at} -> Mês: ${mes}, Match: ${mesMatch}`);
                }
            }
            
            return mesMatch;
        });
        
        console.log(`📅 Metas de setembro: ${septemberMetas.length}`);
        
        // 5. Simular a lógica mesComDados do Dashboard
        console.log('\n5. Simulando lógica mesComDados do Dashboard...');
        
        const filtroMes = '9'; // Setembro
        const filtroRegional = 'todos'; // Todos
        
        // Verificar se há metas para setembro
        const metasDoMes = allMetas.filter(meta => {
            let mesMatch = false;
            
            if (meta.dataInicio) {
                const date = new Date(meta.dataInicio);
                if (!isNaN(date.getTime())) {
                    const mes = (date.getMonth() + 1).toString();
                    mesMatch = filtroMes === mes;
                }
            } else if (meta.data_inicio) {
                const date = new Date(meta.data_inicio);
                if (!isNaN(date.getTime())) {
                    const mes = (date.getMonth() + 1).toString();
                    mesMatch = filtroMes === mes;
                }
            } else if (meta.created_at) {
                const date = new Date(meta.created_at);
                if (!isNaN(date.getTime())) {
                    const mes = (date.getMonth() + 1).toString();
                    mesMatch = filtroMes === mes;
                }
            }
            
            return mesMatch;
        });
        
        // Verificar se há atividades regionais para setembro
        const atividadesDoMes = allActivities.filter(atividade => {
            let mesMatch = false;
            
            if (atividade.activity_date) {
                const date = new Date(atividade.activity_date);
                if (!isNaN(date.getTime())) {
                    const mes = (date.getMonth() + 1).toString();
                    mesMatch = filtroMes === mes;
                }
            } else if (atividade.data_inicio) {
                const date = new Date(atividade.data_inicio);
                if (!isNaN(date.getTime())) {
                    const mes = (date.getMonth() + 1).toString();
                    mesMatch = filtroMes === mes;
                }
            } else if (atividade.created_at) {
                const date = new Date(atividade.created_at);
                if (!isNaN(date.getTime())) {
                    const mes = (date.getMonth() + 1).toString();
                    mesMatch = filtroMes === mes;
                }
            }
            
            // Aplicar filtro de status ativo
            const statusMatch = atividade.status === 'ativo';
            
            return mesMatch && statusMatch;
        });
        
        console.log(`📊 Metas do mês (setembro): ${metasDoMes.length}`);
        console.log(`📊 Atividades do mês (setembro): ${atividadesDoMes.length}`);
        
        // Resultado da lógica mesComDados
        const mesComDados = metasDoMes.length > 0 || atividadesDoMes.length > 0;
        console.log(`✅ mesComDados resultado: ${mesComDados}`);
        
        // 6. Análise do problema
        console.log('\n6. Análise do problema:');
        if (septemberActivities.length > 0 && !mesComDados) {
            console.log('❌ PROBLEMA IDENTIFICADO: Existem atividades de setembro, mas mesComDados retorna false');
            console.log('   Isso significa que o Dashboard não mostrará as atividades mesmo elas existindo');
            
            // Verificar se o problema é o status
            const atividadesAtivasSeptember = septemberActivities.filter(a => a.status === 'ativo');
            console.log(`   Atividades de setembro com status 'ativo': ${atividadesAtivasSeptember.length}`);
            
        } else if (septemberActivities.length > 0 && mesComDados) {
            console.log('✅ OK: Existem atividades de setembro e mesComDados retorna true');
        } else if (septemberActivities.length === 0) {
            console.log('⚠️  Não há atividades de setembro no banco de dados');
        }
        
        // 7. Verificar estrutura das datas
        console.log('\n7. Verificando estrutura das datas das primeiras atividades:');
        allActivities.slice(0, 5).forEach((activity, i) => {
            console.log(`   Atividade ${i+1}:`);
            console.log(`     activity_date: ${activity.activity_date} (tipo: ${typeof activity.activity_date})`);
            console.log(`     data_inicio: ${activity.data_inicio} (tipo: ${typeof activity.data_inicio})`);
            console.log(`     created_at: ${activity.created_at} (tipo: ${typeof activity.created_at})`);
            console.log(`     status: ${activity.status}`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao investigar:', error.message);
    }
}

debugSeptemberIssue();