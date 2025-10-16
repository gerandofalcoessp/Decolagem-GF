const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function consultarAtividades() {
  try {
    console.log('🔍 Consultando atividades através da API...');
    
    // Consultar atividades regionais
    const responseRegional = await fetch('http://localhost:3002/api/atividades');
    const atividadesRegionais = await responseRegional.json();
    
    console.log('📊 Resposta Atividades Regionais:', atividadesRegionais);
    
    // Consultar eventos do calendário
    const responseCalendar = await fetch('http://localhost:3002/api/calendar-events');
    const eventosCalendario = await responseCalendar.json();
    
    console.log('📅 Resposta Eventos do Calendário:', eventosCalendario);
    
    // Verificar se as respostas são arrays
    if (!Array.isArray(atividadesRegionais)) {
      console.log('⚠️ Atividades regionais não é um array:', typeof atividadesRegionais);
      return;
    }
    
    if (!Array.isArray(eventosCalendario)) {
      console.log('⚠️ Eventos do calendário não é um array:', typeof eventosCalendario);
      return;
    }
    
    // Analisar tipos de atividades
    const tiposAtividades = {};
    atividadesRegionais.forEach(atividade => {
      const tipo = atividade.atividade_label || atividade.type || 'Outros';
      tiposAtividades[tipo] = (tiposAtividades[tipo] || 0) + (parseInt(atividade.quantidade) || 1);
    });
    
    console.log('\n📋 Tipos de Atividades Regionais:');
    Object.entries(tiposAtividades).forEach(([tipo, total]) => {
      console.log(`  - ${tipo}: ${total}`);
    });
    
    // Analisar dados específicos para os cards
    console.log('\n🎯 Dados específicos para os cards:');
    
    // Total de Pessoas Atendidas
    const pessoasAtendidas = tiposAtividades['Pessoas Atendidas'] || 0;
    console.log(`  - Total de Pessoas Atendidas: ${pessoasAtendidas}`);
    
    // Leads do dia (atividades de hoje)
    const hoje = new Date().toISOString().split('T')[0];
    const leadsDoDia = atividadesRegionais.filter(atividade => {
      const dataAtividade = atividade.activity_date?.split('T')[0];
      return dataAtividade === hoje && (atividade.atividade_label?.toLowerCase().includes('lead') || atividade.type?.toLowerCase().includes('lead'));
    }).reduce((total, atividade) => total + (parseInt(atividade.quantidade) || 1), 0);
    console.log(`  - Leads do dia: ${leadsDoDia}`);
    
    // Total de Leads
    const totalLeads = Object.entries(tiposAtividades)
      .filter(([tipo]) => tipo.toLowerCase().includes('lead'))
      .reduce((total, [, quantidade]) => total + quantidade, 0);
    console.log(`  - Total de Leads: ${totalLeads}`);
    
    // NPS
    const nps = tiposAtividades['NPS'] || 0;
    console.log(`  - NPS: ${nps}`);
    
    // Ligas Maras Formadas
    const ligasMaras = tiposAtividades['Ligas Maras Formadas'] || 0;
    console.log(`  - Ligas Maras Formadas: ${ligasMaras}`);
    
    // Diagnósticos Realizados
    const diagnosticos = tiposAtividades['Diagnósticos Realizados'] || 0;
    console.log(`  - Diagnósticos Realizados: ${diagnosticos}`);
    
    // Famílias Embarcadas
    const familiasEmbarcadas = tiposAtividades['Famílias Embarcadas'] || 0;
    console.log(`  - Famílias Embarcadas: ${familiasEmbarcadas}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

consultarAtividades();