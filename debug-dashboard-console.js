// Script para adicionar logs de debug temporários ao dashboard
// para verificar os dados reais que estão sendo recebidos

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'frontend', 'src', 'pages', 'dashboard', 'DashboardPage.tsx');

console.log('🔧 Adicionando logs de debug ao dashboard...');

// Ler o arquivo atual
let content = fs.readFileSync(dashboardPath, 'utf8');

// Adicionar logs após a inicialização do activitiesArray
const activitiesArrayLine = '  const activitiesArray = Array.isArray(activities) ? activities as Atividade[] : [];';
const debugCode = `  const activitiesArray = Array.isArray(activities) ? activities as Atividade[] : [];
  
  // DEBUG: Logs temporários para investigar o problema
  console.log('🔍 DEBUG Dashboard - Dados recebidos:');
  console.log('activities (raw):', activities);
  console.log('activitiesArray length:', activitiesArray.length);
  console.log('activitiesArray sample:', activitiesArray.slice(0, 3));
  
  // Testar especificamente as famílias embarcadas
  const familiasLabels = ["Famílias Embarcadas Decolagem", "familias_embarcadas_decolagem"];
  const familiasCount = activitiesArray.filter(a => {
    const match = familiasLabels.some(l => {
      const fields = [
        (a as any).atividade_label,
        (a as any).titulo,
        (a as any).tipo,
        (a as any).categoria
      ].filter(Boolean);
      return fields.some(f => {
        // Simplified matching for debug
        const normalized = f.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
        return normalized.includes('família') && normalized.includes('embarcada') && normalized.includes('decolagem');
      });
    });
    if (match) {
      console.log('✅ Matched activity:', {
        id: (a as any).id,
        atividade_label: (a as any).atividade_label,
        titulo: (a as any).titulo,
        quantidade: (a as any).quantidade
      });
    }
    return match;
  });
  console.log('Famílias matched count:', familiasCount.length);
  console.log('Total quantidade:', familiasCount.reduce((sum, a) => sum + ((a as any).quantidade || 0), 0));`;

// Substituir a linha
content = content.replace(activitiesArrayLine, debugCode);

// Escrever o arquivo modificado
fs.writeFileSync(dashboardPath, content, 'utf8');

console.log('✅ Logs de debug adicionados ao dashboard!');
console.log('📝 Agora abra o navegador e verifique o console para ver os dados reais.');
console.log('🔄 Lembre-se de remover os logs depois do debug.');