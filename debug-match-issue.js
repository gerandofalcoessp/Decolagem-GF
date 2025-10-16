const fetch = require('node-fetch');

async function debugMatchIssue() {
    console.log('🔍 Testando função doesActivityMatch...\n');

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

        // 4. Testar com uma atividade específica
        const familyActivity = activities.find(a => a.titulo === 'Famílias Embarcadas Decolagem');
        if (familyActivity) {
            console.log('3. Testando com atividade específica...');
            console.log('📋 Atividade de teste:');
            console.log(`   ID: ${familyActivity.id}`);
            console.log(`   atividade_label: "${familyActivity.atividade_label}" (tipo: ${typeof familyActivity.atividade_label})`);
            console.log(`   titulo: "${familyActivity.titulo}" (tipo: ${typeof familyActivity.titulo})`);
            console.log(`   tipo: "${familyActivity.tipo}" (tipo: ${typeof familyActivity.tipo})`);
            console.log(`   categoria: "${familyActivity.categoria}" (tipo: ${typeof familyActivity.categoria})`);

            // Testar filter(Boolean)
            const fields = [
                familyActivity.atividade_label,
                familyActivity.titulo,
                familyActivity.tipo,
                familyActivity.categoria
            ];
            console.log('\n🔍 Campos antes do filter(Boolean):');
            fields.forEach((field, index) => {
                console.log(`   ${index}: "${field}" (tipo: ${typeof field}, Boolean: ${Boolean(field)})`);
            });

            const filteredFields = fields.filter(Boolean);
            console.log('\n✅ Campos após filter(Boolean):');
            filteredFields.forEach((field, index) => {
                console.log(`   ${index}: "${field}"`);
            });

            // Testar com cada label
            const labels = ['Famílias Embarcadas Decolagem', 'familias_embarcadas_decolagem'];
            labels.forEach(label => {
                console.log(`\n🏷️  Testando label: "${label}"`);
                const match = doesActivityMatch(familyActivity, label);
                console.log(`   Match result: ${match}`);

                // Testar cada campo individualmente
                filteredFields.forEach((field, index) => {
                    const fieldMatch = isStringMatch(field, label);
                    console.log(`   Campo ${index} ("${field}") vs "${label}": ${fieldMatch}`);
                    
                    if (fieldMatch) {
                        console.log(`     Tokens campo: [${canonicalizeTokens(field).join(', ')}]`);
                        console.log(`     Tokens label: [${canonicalizeTokens(label).join(', ')}]`);
                    }
                });
            });
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

debugMatchIssue();