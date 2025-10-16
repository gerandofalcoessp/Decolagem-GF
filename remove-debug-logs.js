// Script para remover os logs de debug temporários
const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'frontend', 'src', 'pages', 'dashboard', 'DashboardPage.tsx');

try {
    let content = fs.readFileSync(dashboardPath, 'utf8');
    
    // Remover os logs de debug
    const debugStart = '  // === DEBUG LOGS TEMPORÁRIOS ===';
    const debugEnd = '  // === FIM DEBUG LOGS ===';
    
    const startIndex = content.indexOf(debugStart);
    const endIndex = content.indexOf(debugEnd);
    
    if (startIndex !== -1 && endIndex !== -1) {
        const before = content.substring(0, startIndex);
        const after = content.substring(endIndex + debugEnd.length);
        content = before + after;
        
        fs.writeFileSync(dashboardPath, content, 'utf8');
        console.log('✅ Debug logs removidos do DashboardPage.tsx');
    } else {
        console.log('ℹ️  Nenhum debug log encontrado para remover');
    }
    
} catch (error) {
    console.error('❌ Erro ao remover debug logs:', error.message);
}