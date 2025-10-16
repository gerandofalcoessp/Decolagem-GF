// Script para adicionar logs detalhados no dashboard
const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'frontend', 'src', 'pages', 'dashboard', 'DashboardPage.tsx');

try {
    let content = fs.readFileSync(dashboardPath, 'utf8');
    
    // Adicionar logs detalhados após a inicialização dos arrays
    const searchPattern = /const decolagemArray = Array\.isArray\(decolagemData\) \? decolagemData as Participante\[\] : \[\];/;
    
    const debugLogs = `
  // === DEBUG LOGS TEMPORÁRIOS ===
  console.log('🔍 DASHBOARD DEBUG - Dados recebidos:');
  console.log('activities (raw):', activities);
  console.log('activities type:', typeof activities);
  console.log('activities isArray:', Array.isArray(activities));
  if (activities && typeof activities === 'object' && !Array.isArray(activities)) {
    console.log('activities keys:', Object.keys(activities));
    console.log('activities.data:', activities.data);
    console.log('activities.data type:', typeof activities.data);
    console.log('activities.data isArray:', Array.isArray(activities.data));
  }
  console.log('activitiesArray length:', activitiesArray.length);
  console.log('activitiesArray sample:', activitiesArray.slice(0, 2));
  
  // Debug específico para Famílias Embarcadas Decolagem
  const familiesDebug = activitiesArray.filter(activity => {
    const searchTerm = 'Famílias Embarcadas Decolagem';
    return (
      activity.atividade_label?.includes(searchTerm) ||
      activity.titulo?.includes(searchTerm) ||
      activity.tipo?.includes(searchTerm) ||
      activity.categoria?.includes(searchTerm)
    );
  });
  console.log('🏠 Famílias Embarcadas encontradas:', familiesDebug.length);
  console.log('🏠 Famílias Embarcadas dados:', familiesDebug);
  
  const familiesTotal = familiesDebug.reduce((sum, activity) => {
    const quantidade = parseInt(activity.quantidade) || 0;
    console.log('Somando quantidade:', quantidade, 'de atividade:', activity.titulo || activity.atividade_label);
    return sum + quantidade;
  }, 0);
  console.log('🏠 Total Famílias Embarcadas calculado:', familiesTotal);
  // === FIM DEBUG LOGS ===`;
    
    if (content.includes('=== DEBUG LOGS TEMPORÁRIOS ===')) {
        console.log('✅ Debug logs já estão presentes no arquivo');
        return;
    }
    
    const replacement = `const decolagemArray = Array.isArray(decolagemData) ? decolagemData as Participante[] : [];${debugLogs}`;
    
    content = content.replace(searchPattern, replacement);
    
    fs.writeFileSync(dashboardPath, content, 'utf8');
    console.log('✅ Debug logs adicionados ao DashboardPage.tsx');
    console.log('📝 Abra o console do navegador para ver os logs detalhados');
    console.log('⚠️  Lembre-se de remover os logs depois!');
    
} catch (error) {
    console.error('❌ Erro ao adicionar debug logs:', error.message);
}