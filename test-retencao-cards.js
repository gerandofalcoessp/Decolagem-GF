// Script para testar os cards de retenção
// Este script testa se o endpoint /api/instituicoes/stats retorna os dados corretos
// para calcular a retenção de Decolagem e Maras

async function testRetencaoCards() {
    console.log('🧪 Testando cards de retenção...\n');
    
    try {
        // Fazer requisição para o endpoint de stats
        const response = await fetch('http://localhost:3001/api/instituicoes/stats');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Dados recebidos do endpoint /api/instituicoes/stats:');
        console.log(JSON.stringify(data, null, 2));
        
        // Verificar se os dados necessários estão presentes
        console.log('\n✅ Verificando estrutura dos dados:');
        
        // Verificar porPrograma (instituições ativas)
        if (data.porPrograma) {
            console.log('✓ porPrograma encontrado:', data.porPrograma);
        } else {
            console.log('❌ porPrograma não encontrado');
        }
        
        // Verificar evasaoPorPrograma (instituições evadidas)
        if (data.evasaoPorPrograma) {
            console.log('✓ evasaoPorPrograma encontrado:', data.evasaoPorPrograma);
        } else {
            console.log('❌ evasaoPorPrograma não encontrado');
        }
        
        // Calcular retenção Decolagem
        if (data.porPrograma && data.evasaoPorPrograma) {
            const ativasDecolagem = data.porPrograma.decolagem || 0;
            const evadidasDecolagem = data.evasaoPorPrograma.decolagem || 0;
            const totalDecolagem = ativasDecolagem + evadidasDecolagem;
            const retencaoDecolagem = totalDecolagem > 0 ? (ativasDecolagem / totalDecolagem) * 100 : 0;
            
            console.log('\n📈 Cálculo Retenção Decolagem:');
            console.log(`   Ativas: ${ativasDecolagem}`);
            console.log(`   Evadidas: ${evadidasDecolagem}`);
            console.log(`   Total: ${totalDecolagem}`);
            console.log(`   Retenção: ${retencaoDecolagem.toFixed(1)}%`);
        }
        
        // Calcular retenção Maras
        if (data.porPrograma && data.evasaoPorPrograma) {
            const ativasMaras = data.porPrograma.maras || 0;
            const evadidasMaras = data.evasaoPorPrograma.maras || 0;
            const totalMaras = ativasMaras + evadidasMaras;
            const retencaoMaras = totalMaras > 0 ? (ativasMaras / totalMaras) * 100 : 0;
            
            console.log('\n📈 Cálculo Retenção Maras:');
            console.log(`   Ativas: ${ativasMaras}`);
            console.log(`   Evadidas: ${evadidasMaras}`);
            console.log(`   Total: ${totalMaras}`);
            console.log(`   Retenção: ${retencaoMaras.toFixed(1)}%`);
        }
        
        console.log('\n🎉 Teste concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao testar cards de retenção:', error);
    }
}

// Executar o teste
testRetencaoCards();