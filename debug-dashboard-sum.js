const fetch = require('node-fetch');

async function debugDashboardSum() {
    console.log('🔍 Testando cálculo exato do dashboard...\n');

    try {
        // 1. Fazer login
        console.log('1. Fazendo login...');
        const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'flavio.almeida@gerandofalcoes.com',
                password: '123456'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.session?.access_token || loginData.access_token || loginData.token;
        console.log('✅ Login realizado com sucesso\n');

        // 2. Buscar atividades
        console.log('2. Buscando atividades da API...');
        const activitiesResponse = await fetch('http://localhost:4000/api/regional-activities', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const activitiesArray = await activitiesResponse.json();
        console.log(`📊 Total de atividades: ${activitiesArray.length}\n`);

        // 3. Implementar as funções exatas do dashboard
        const normalize = (str) => {
            if (!str || typeof str !== 'string') return '';
            return str.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        };

        const canonicalizeTokens = (str) => {
            const tokens = normalize(str).split(' ').filter(Boolean);
            const map = {
                'familias': 'familia',
                'embarcadas': 'embarcada',
                'decolagem': 'decolagem',
                'maras': 'mara'
            };
            return tokens.map(tok => map[tok] || tok);
        };

        const isStringMatch = (a, b) => {
            const ta = canonicalizeTokens(a);
            const tb = canonicalizeTokens(b);
            if (ta.length === 0 || tb.length === 0) return false;
            const setA = new Set(ta);
            const inter = tb.filter(x => setA.has(x));
            const requireProgramToken = tb.includes('decolagem') || tb.includes('maras');
            const hasProgramToken = inter.includes('decolagem') || inter.includes('maras');
            const requiredOverlap = Math.min(tb.length, 2);
            if (requireProgramToken) {
                return hasProgramToken && inter.length >= requiredOverlap;
            }
            return inter.length >= requiredOverlap;
        };

        const doesActivityMatch = (activity, label) => {
            const fields = [
                activity.atividade_label,
                activity.titulo,
                activity.tipo,
                activity.categoria
            ].filter(Boolean);
            return fields.some(f => isStringMatch(f, label));
        };

        const sumActivitiesByLabels = (labels, options) => {
            return activitiesArray.reduce((acc, a) => {
                const match = labels.some(l => doesActivityMatch(a, l));
                if (!match) return acc;
                if (options?.todayOnly) {
                    // Buscar a melhor data disponível na atividade (compatível com DashboardMetasPage)
                    const activityDate = a.activity_date || a.data_inicio || a.created_at || a.data || a.date;
                    // Implementação simplificada do isSameDay
                    if (activityDate) {
                        const d = new Date(activityDate);
                        const now = new Date();
                        const isSameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
                        if (!isSameDay) return acc;
                    }
                }
                // Quantidade pode vir como string ou número e com diferentes nomes de campo
                const qRaw = a.quantidade ?? a.qtd ?? 1;
                const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
                return acc + (isNaN(numQ) ? 1 : numQ);
            }, 0);
        };

        // 4. Testar o cálculo exato do dashboard
        console.log('3. Calculando familiasEmbarcadasRealizado...');
        const labels = ['Famílias Embarcadas Decolagem', 'familias_embarcadas_decolagem'];
        const familiasEmbarcadasRealizado = sumActivitiesByLabels(labels);
        
        console.log(`🎯 Resultado: ${familiasEmbarcadasRealizado}`);
        console.log(`📊 Tipo do resultado: ${typeof familiasEmbarcadasRealizado}\n`);

        // 5. Detalhar o processo
        console.log('4. Detalhando o processo...');
        let totalSum = 0;
        let matchCount = 0;
        
        activitiesArray.forEach((a, index) => {
            const match = labels.some(l => doesActivityMatch(a, l));
            if (match) {
                matchCount++;
                const qRaw = a.quantidade ?? a.qtd ?? 1;
                const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
                const finalQ = isNaN(numQ) ? 1 : numQ;
                totalSum += finalQ;
                
                console.log(`   Atividade ${index + 1}:`);
                console.log(`     ID: ${a.id}`);
                console.log(`     Título: "${a.titulo}"`);
                console.log(`     qRaw: "${qRaw}" (tipo: ${typeof qRaw})`);
                console.log(`     numQ: ${numQ} (tipo: ${typeof numQ})`);
                console.log(`     finalQ: ${finalQ}`);
                console.log(`     totalSum até agora: ${totalSum}\n`);
            }
        });

        console.log(`📈 Total de atividades que fizeram match: ${matchCount}`);
        console.log(`🧮 Soma manual: ${totalSum}`);
        console.log(`🎯 Resultado da função: ${familiasEmbarcadasRealizado}`);
        console.log(`✅ Resultados coincidem: ${totalSum === familiasEmbarcadasRealizado}`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

debugDashboardSum();