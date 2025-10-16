// Script para testar o filtro de setembro no Dashboard
// Execute este script no console do navegador na página do Dashboard

console.log('=== TESTE DO FILTRO DE SETEMBRO ===');

// Simular seleção do filtro de setembro
const mesSelect = document.querySelector('select[value="Setembro"]') || 
                  document.querySelector('select option[value="9"]')?.parentElement ||
                  document.querySelector('select option[value="setembro"]')?.parentElement;

if (mesSelect) {
    console.log('Elemento select do mês encontrado:', mesSelect);
    
    // Verificar as opções disponíveis
    const options = mesSelect.querySelectorAll('option');
    console.log('Opções disponíveis no select de mês:');
    options.forEach((option, index) => {
        console.log(`${index}: ${option.value} - ${option.textContent}`);
    });
    
    // Tentar selecionar setembro
    const setemberOption = Array.from(options).find(opt => 
        opt.textContent.toLowerCase().includes('setembro') || 
        opt.value === '9' || 
        opt.value === 'setembro'
    );
    
    if (setemberOption) {
        console.log('Opção de setembro encontrada:', setemberOption);
        setemberOption.selected = true;
        
        // Disparar evento de mudança
        const changeEvent = new Event('change', { bubbles: true });
        mesSelect.dispatchEvent(changeEvent);
        
        console.log('Filtro de setembro selecionado');
        
        // Aguardar um pouco e verificar os dados
        setTimeout(() => {
            console.log('=== VERIFICANDO DADOS APÓS FILTRO ===');
            
            // Verificar se há elementos de atividades visíveis
            const atividadeElements = document.querySelectorAll('[data-testid*="atividade"], .atividade, .activity');
            console.log('Elementos de atividades encontrados:', atividadeElements.length);
            
            // Verificar se há mensagens de "sem dados"
            const noDataMessages = document.querySelectorAll('[data-testid*="no-data"], .no-data, .empty-state');
            console.log('Mensagens de "sem dados" encontradas:', noDataMessages.length);
            
            // Verificar se há cards de estatísticas
            const statsCards = document.querySelectorAll('.card, .stat-card, [data-testid*="stat"]');
            console.log('Cards de estatísticas encontrados:', statsCards.length);
            
            // Verificar o console para logs de debug
            console.log('Verifique os logs de debug do mesComDados acima');
            
        }, 2000);
        
    } else {
        console.log('Opção de setembro não encontrada no select');
    }
    
} else {
    console.log('Select de mês não encontrado');
    
    // Tentar encontrar outros elementos relacionados ao filtro
    const filterElements = document.querySelectorAll('[data-testid*="filter"], .filter, select');
    console.log('Elementos de filtro encontrados:', filterElements.length);
    filterElements.forEach((el, index) => {
        console.log(`Filtro ${index}:`, el);
    });
}

// Verificar se há dados de setembro no estado da aplicação
if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
    console.log('React detectado - tentando acessar estado da aplicação');
    // Nota: Isso pode não funcionar em produção devido às otimizações do React
}

console.log('=== FIM DO TESTE ===');