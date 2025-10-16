const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function consultarDadosReais() {
    try {
        console.log('🔐 Consultando dados reais do banco de dados...\n');
        
        // 1. Fazer login para obter token válido
        console.log('1. Fazendo login para obter token...');
        
        const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'flavio.almeida@gerandofalcoes.com',
                password: '123456'
            })
        });
        
        if (!loginResponse.ok) {
            const errorText = await loginResponse.text();
            console.log('❌ Erro no login:', loginResponse.status, errorText);
            return;
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Login realizado com sucesso');
        
        const token = loginData.session?.access_token;
        if (!token) {
            console.log('❌ Token não encontrado na resposta do login');
            console.log('Resposta do login:', JSON.stringify(loginData, null, 2));
            return;
        }
        
        console.log(`✅ Token obtido: ${token.substring(0, 20)}...`);
        
        // 2. Buscar atividades regionais
        console.log('\n2. Buscando atividades regionais...');
        
        const atividadesResponse = await fetch('http://localhost:3002/api/atividades', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!atividadesResponse.ok) {
            const errorText = await atividadesResponse.text();
            console.log('❌ Erro ao buscar atividades:', atividadesResponse.status, errorText);
            return;
        }
        
        const atividadesData = await atividadesResponse.json();
        console.log(`✅ Atividades encontradas: ${atividadesData.data?.length || 0}`);
        
        // 3. Buscar eventos do calendário
        console.log('\n3. Buscando eventos do calendário...');
        
        const eventosResponse = await fetch('http://localhost:3002/api/calendar-events', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!eventosResponse.ok) {
            const errorText = await eventosResponse.text();
            console.log('❌ Erro ao buscar eventos:', eventosResponse.status, errorText);
            return;
        }
        
        const eventosData = await eventosResponse.json();
        console.log(`✅ Eventos encontrados: ${eventosData.data?.length || 0}`);
        
        // 4. Analisar e calcular dados dos cards
        console.log('\n4. Analisando dados dos cards...\n');
        
        const atividades = atividadesData.data || [];
        const eventos = eventosData.data || [];
        
        // Função para contar atividades por label
        function contarPorLabel(label) {
            return atividades.filter(atividade => 
                atividade.atividade_label === label || 
                atividade.atividade_custom_label === label
            ).reduce((total, atividade) => total + (atividade.quantidade || 1), 0);
        }
        
        // Função para contar eventos por tipo
        function contarEventosPorTipo(tipo) {
            return eventos.filter(evento => evento.tipo === tipo).length;
        }
        
        // Calcular dados dos cards
        const cardData = {
            'Total de Pessoas Atendidas': contarPorLabel('Pessoas Atendidas'),
            'Famílias Embarcadas': contarPorLabel('Famílias Embarcadas Decolagem'),
            'Diagnósticos Realizados': contarPorLabel('Diagnósticos Realizados'),
            'ONGs Decolagem': contarPorLabel('ONGs Decolagem'),
            'ONGs Maras': contarPorLabel('ONGs Maras'),
            'Ligas Maras Formadas': contarPorLabel('Ligas Maras Formadas'),
            'Leads do dia': contarPorLabel('Leads do dia'),
            'Total de Leads': contarPorLabel('Total de Leads'),
            'NPS': contarPorLabel('NPS'),
            'Retenção Decolagem': contarPorLabel('Retenção Decolagem'),
            'Retenção Maras': contarPorLabel('Retenção Maras'),
            'Total Maras': contarPorLabel('Total Maras'),
            'Evasão Decolagem': contarPorLabel('Evasão Decolagem'),
            'Inadimplência': contarPorLabel('Inadimplência')
        };
        
        console.log('📊 DADOS DOS CARDS:');
        console.log('==================');
        
        Object.entries(cardData).forEach(([card, valor]) => {
            console.log(`${card}: ${valor}`);
        });
        
        // 5. Mostrar resumo das atividades por label
        console.log('\n📋 RESUMO DAS ATIVIDADES POR LABEL:');
        console.log('===================================');
        
        const labelsCount = {};
        atividades.forEach(atividade => {
            const label = atividade.atividade_label || atividade.atividade_custom_label || 'Sem label';
            labelsCount[label] = (labelsCount[label] || 0) + (atividade.quantidade || 1);
        });
        
        Object.entries(labelsCount)
            .sort(([,a], [,b]) => b - a)
            .forEach(([label, count]) => {
                console.log(`${label}: ${count}`);
            });
        
        // 6. Mostrar resumo dos eventos por tipo
        console.log('\n📅 RESUMO DOS EVENTOS POR TIPO:');
        console.log('===============================');
        
        const tiposCount = {};
        eventos.forEach(evento => {
            const tipo = evento.tipo || 'Sem tipo';
            tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
        });
        
        Object.entries(tiposCount)
            .sort(([,a], [,b]) => b - a)
            .forEach(([tipo, count]) => {
                console.log(`${tipo}: ${count}`);
            });
        
        console.log('\n✅ Consulta concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao consultar dados:', error.message);
    }
}

consultarDadosReais();