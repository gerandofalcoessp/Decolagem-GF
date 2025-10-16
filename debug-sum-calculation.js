const fetch = require('node-fetch');

async function debugSumCalculation() {
    console.log('🧮 Testando cálculo da soma de Famílias Embarcadas...\n');

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

        const activities = await activitiesResponse.json();
        console.log(`📊 Total de atividades: ${activities.length}\n`);

        // 3. Implementar as funções do dashboard
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

        // 4. Testar com os labels do dashboard
        const labels = ['Famílias Embarcadas Decolagem', 'familias_embarcadas_decolagem'];
        
        console.log('3. Testando matching com cada label...');
        labels.forEach(label => {
            console.log(`\n🏷️  Testando label: "${label}"`);
            const matchingActivities = activities.filter(activity => doesActivityMatch(activity, label));
            console.log(`   Atividades que fazem match: ${matchingActivities.length}`);
            
            if (matchingActivities.length > 0) {
                console.log('   Detalhes das atividades:');
                matchingActivities.forEach((activity, index) => {
                    console.log(`     ${index + 1}. ID: ${activity.id}`);
                    console.log(`        titulo: "${activity.titulo}"`);
                    console.log(`        tipo: "${activity.tipo}"`);
                    console.log(`        quantidade: ${activity.quantidade}`);
                    console.log(`        qtd: ${activity.qtd}`);
                });
            }
        });

        // 5. Implementar sumActivitiesByLabels
        const sumActivitiesByLabels = (activities, labels, todayOnly = false) => {
            let sum = 0;
            for (const activity of activities) {
                const matches = labels.some(label => doesActivityMatch(activity, label));
                if (matches) {
                    const value = activity.quantidade || activity.qtd || 0;
                    if (!isNaN(value)) {
                        sum += value;
                    }
                }
            }
            return sum;
        };

        // 6. Calcular o total
        console.log('\n4. Calculando soma total...');
        const total = sumActivitiesByLabels(activities, labels);
        console.log(`🎯 Total calculado: ${total}`);

        // 7. Verificação manual
        console.log('\n5. Verificação manual...');
        const familyActivities = activities.filter(activity => 
            activity.titulo === 'Famílias Embarcadas Decolagem' || 
            activity.tipo === 'familias_embarcadas_decolagem'
        );
        
        console.log(`👨‍👩‍👧‍👦 Atividades de famílias encontradas: ${familyActivities.length}`);
        let manualSum = 0;
        familyActivities.forEach((activity, index) => {
            const value = activity.quantidade || activity.qtd || 0;
            manualSum += value;
            console.log(`   ${index + 1}. ${activity.titulo} - Quantidade: ${value}`);
        });
        console.log(`🧮 Soma manual: ${manualSum}`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

debugSumCalculation();