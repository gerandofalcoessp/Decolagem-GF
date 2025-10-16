const fetch = require('node-fetch');

async function debugApiDataDetailed() {
    console.log('🔍 Analisando dados detalhados da API...\n');

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

        if (loginResponse.status !== 200) {
            console.error('❌ Erro no login:', loginResponse.status);
            return;
        }

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

        if (activitiesResponse.status !== 200) {
            console.error('❌ Erro na API de atividades:', activitiesResponse.status);
            return;
        }

        const activities = await activitiesResponse.json();
        console.log(`📊 Total de atividades: ${activities.length}\n`);

        // 3. Analisar estrutura dos dados
        console.log('3. Analisando estrutura dos dados...');
        if (activities.length > 0) {
            console.log('📋 Campos disponíveis na primeira atividade:');
            const firstActivity = activities[0];
            Object.keys(firstActivity).forEach(key => {
                console.log(`   - ${key}: ${typeof firstActivity[key]} = ${JSON.stringify(firstActivity[key])}`);
            });
            console.log('');
        }

        // 4. Procurar por atividades relacionadas a "Famílias"
        console.log('4. Procurando atividades relacionadas a "Famílias"...');
        const familyRelated = activities.filter(activity => {
            const searchFields = [
                activity.atividade_label,
                activity.titulo,
                activity.tipo,
                activity.categoria,
                activity.nome,
                activity.descricao
            ];
            
            return searchFields.some(field => 
                field && typeof field === 'string' && 
                field.toLowerCase().includes('famil')
            );
        });

        console.log(`👨‍👩‍👧‍👦 Atividades relacionadas a "Famílias": ${familyRelated.length}`);
        
        if (familyRelated.length > 0) {
            console.log('\n📝 Detalhes das atividades relacionadas a famílias:');
            familyRelated.forEach((activity, index) => {
                console.log(`\n   Atividade ${index + 1}:`);
                console.log(`   - ID: ${activity.id}`);
                console.log(`   - atividade_label: "${activity.atividade_label}"`);
                console.log(`   - titulo: "${activity.titulo}"`);
                console.log(`   - tipo: "${activity.tipo}"`);
                console.log(`   - categoria: "${activity.categoria}"`);
                console.log(`   - quantidade: ${activity.quantidade}`);
                console.log(`   - qtd: ${activity.qtd}`);
                console.log(`   - valor_realizado: ${activity.valor_realizado}`);
            });
        }

        // 5. Procurar especificamente por "Embarcadas"
        console.log('\n5. Procurando especificamente por "Embarcadas"...');
        const embarcadasRelated = activities.filter(activity => {
            const searchFields = [
                activity.atividade_label,
                activity.titulo,
                activity.tipo,
                activity.categoria,
                activity.nome,
                activity.descricao
            ];
            
            return searchFields.some(field => 
                field && typeof field === 'string' && 
                field.toLowerCase().includes('embarcad')
            );
        });

        console.log(`🚢 Atividades relacionadas a "Embarcadas": ${embarcadasRelated.length}`);
        
        if (embarcadasRelated.length > 0) {
            console.log('\n📝 Detalhes das atividades relacionadas a embarcadas:');
            embarcadasRelated.forEach((activity, index) => {
                console.log(`\n   Atividade ${index + 1}:`);
                console.log(`   - ID: ${activity.id}`);
                console.log(`   - atividade_label: "${activity.atividade_label}"`);
                console.log(`   - titulo: "${activity.titulo}"`);
                console.log(`   - tipo: "${activity.tipo}"`);
                console.log(`   - categoria: "${activity.categoria}"`);
                console.log(`   - quantidade: ${activity.quantidade}`);
                console.log(`   - qtd: ${activity.qtd}`);
                console.log(`   - valor_realizado: ${activity.valor_realizado}`);
            });
        }

        // 6. Listar todos os valores únicos de atividade_label
        console.log('\n6. Todos os valores únicos de atividade_label:');
        const uniqueLabels = [...new Set(activities.map(a => a.atividade_label).filter(Boolean))];
        uniqueLabels.sort().forEach(label => {
            const count = activities.filter(a => a.atividade_label === label).length;
            console.log(`   - "${label}" (${count} atividades)`);
        });

        // 7. Listar todos os valores únicos de titulo
        console.log('\n7. Todos os valores únicos de titulo:');
        const uniqueTitles = [...new Set(activities.map(a => a.titulo).filter(Boolean))];
        uniqueTitles.sort().forEach(title => {
            const count = activities.filter(a => a.titulo === title).length;
            console.log(`   - "${title}" (${count} atividades)`);
        });

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

debugApiDataDetailed();