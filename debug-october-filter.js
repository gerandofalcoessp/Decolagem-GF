const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOctoberFilter() {
    console.log('🔍 Investigando filtro de outubro para área Nordeste 1...\n');

    try {
        // 1. Buscar todas as atividades de Nordeste 1
        console.log('1. Buscando todas as atividades da área "Nordeste 1":');
        const { data: allActivities, error: allError } = await supabase
            .from('regional_activities')
            .select('*')
            .eq('regional', 'nordeste_1')
            .order('activity_date');

        if (allError) {
            console.error('❌ Erro ao buscar atividades:', allError);
            return;
        }

        console.log(`📊 Total de atividades em Nordeste 1: ${allActivities.length}`);
        
        if (allActivities.length > 0) {
            console.log('\n📅 Distribuição por mês/ano:');
            const distribution = {};
            allActivities.forEach(activity => {
                const date = new Date(activity.activity_date);
                const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
                distribution[monthYear] = (distribution[monthYear] || 0) + 1;
            });
            
            Object.entries(distribution).forEach(([monthYear, count]) => {
                console.log(`   ${monthYear}: ${count} atividades`);
            });
        }

        // 2. Filtrar especificamente por setembro 2025
        console.log('\n2. Filtrando por setembro 2025:');
        const { data: septemberActivities, error: septError } = await supabase
            .from('regional_activities')
            .select('*')
            .eq('regional', 'nordeste_1')
            .gte('activity_date', '2025-09-01')
            .lt('activity_date', '2025-10-01')
            .order('activity_date');

        if (septError) {
            console.error('❌ Erro ao filtrar setembro:', septError);
        } else {
            console.log(`📊 Atividades em setembro 2025: ${septemberActivities.length}`);
            septemberActivities.forEach(activity => {
                console.log(`   - ${activity.activity_date}: ${activity.title}`);
            });
        }

        // 3. Filtrar especificamente por outubro 2025
        console.log('\n3. Filtrando por outubro 2025:');
        const { data: octoberActivities, error: octError } = await supabase
            .from('regional_activities')
            .select('*')
            .eq('regional', 'nordeste_1')
            .gte('activity_date', '2025-10-01')
            .lt('activity_date', '2025-11-01')
            .order('activity_date');

        if (octError) {
            console.error('❌ Erro ao filtrar outubro:', octError);
        } else {
            console.log(`📊 Atividades em outubro 2025: ${octoberActivities.length}`);
            octoberActivities.forEach(activity => {
                console.log(`   - ${activity.activity_date}: ${activity.title}`);
            });
        }

        // 4. Simular a lógica do Dashboard
        console.log('\n4. Simulando lógica do Dashboard:');
        
        // Simular filtro por mês (como no Dashboard)
        const simulateMonthFilter = (activities, month, year) => {
            return activities.filter(activity => {
                const activityDate = new Date(activity.activity_date);
                const activityMonth = activityDate.getMonth() + 1; // JavaScript months are 0-based
                const activityYear = activityDate.getFullYear();
                
                console.log(`   Atividade: ${activity.activity_date} -> Mês: ${activityMonth}, Ano: ${activityYear}`);
                
                return activityMonth === month && activityYear === year;
            });
        };

        console.log('\n   Simulando filtro para setembro (mês 9, ano 2025):');
        const dashboardSeptember = simulateMonthFilter(allActivities, 9, 2025);
        console.log(`   Resultado: ${dashboardSeptember.length} atividades`);

        console.log('\n   Simulando filtro para outubro (mês 10, ano 2025):');
        const dashboardOctober = simulateMonthFilter(allActivities, 10, 2025);
        console.log(`   Resultado: ${dashboardOctober.length} atividades`);

        // 5. Verificar se há problema na lógica de filtro
        console.log('\n5. Análise do problema:');
        if (dashboardSeptember.length > 0 && dashboardOctober.length === 0) {
            console.log('✅ Filtro funcionando corretamente: setembro tem atividades, outubro não tem');
        } else if (dashboardSeptember.length > 0 && dashboardOctober.length > 0) {
            console.log('⚠️  Ambos os meses têm atividades - verificar se é esperado');
        } else if (dashboardOctober.length > 0 && dashboardSeptember.length === 0) {
            console.log('⚠️  Apenas outubro tem atividades');
        } else {
            console.log('❌ Nenhum mês tem atividades - possível problema no filtro');
        }

    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

debugOctoberFilter();