const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Mapeamento de regionais do frontend (REGIONAL_LABELS)
const REGIONAL_LABELS = {
  todas: 'Todas as Regionais',
  nacional: 'Nacional',
  comercial: 'Comercial',
  centro_oeste: 'Centro-Oeste',
  mg_es: 'MG/ES',
  nordeste_1: 'Nordeste 1',
  nordeste_2: 'Nordeste 2',
  norte: 'Norte',
  rj: 'Rio de Janeiro',
  sp: 'São Paulo',
  sul: 'Sul',
};

// Lista de regionais disponíveis (do Configuracoes.tsx)
const regionaisDisponiveis = [
  'Centro-Oeste',
  'MG/ES', 
  'Nordeste 1',
  'Nordeste 2',
  'Norte',
  'Rio de Janeiro',
  'São Paulo',
  'Sul',
  'Nacional',
  'Comercial'
];

// Simular goalService.ts CORRIGIDO - Extrair regionais da descrição
function extractRegionaisFromGoalCorrected(goal) {
  console.log(`\n🔍 Processando goal: "${goal.nome}"`);
  console.log(`📝 Descrição: "${goal.descricao}"`);
  
  // Extrair regionais da descrição (regex corrigida)
  const regionaisMatch = goal.descricao.match(/(?:regional|regionais|área|áreas):\s*([^|\n]+)/i);
  let regionais = [];
  
  if (regionaisMatch) {
    const regionaisStr = regionaisMatch[1].trim();
    console.log(`🎯 String de regionais extraída: "${regionaisStr}"`);
    
    // Mapear os valores encontrados para as chaves corretas do REGIONAL_LABELS
    const mapeamentoAreas = {
      'nacional': 'nacional',
      'comercial': 'comercial',
      'centro-oeste': 'centro_oeste',
      'centro oeste': 'centro_oeste',
      'mg/es': 'mg_es',
      'mg es': 'mg_es',
      'minas gerais': 'mg_es',
      'espirito santo': 'mg_es',
      'nordeste 1': 'nordeste_1',
      'nordeste1': 'nordeste_1',
      'nordeste 2': 'nordeste_2',
      'nordeste2': 'nordeste_2',
      'norte': 'norte',
      'rj': 'rj',
      'rio de janeiro': 'rj',
      'sp': 'sp',
      'são paulo': 'sp',
      'sao paulo': 'sp',
      'sul': 'sul'
    };
    
    if (regionaisStr.toLowerCase().includes('todas')) {
      // CORREÇÃO: Quando é "todas", mapear para todas as regionais específicas
      regionais = ['centro_oeste', 'mg_es', 'nordeste_1', 'nordeste_2', 'norte', 'rj', 'sp', 'sul', 'nacional', 'comercial'];
      console.log(`✅ Detectado "todas" - mapeando para TODAS as regionais: ${JSON.stringify(regionais)}`);
    } else if (regionaisStr.toLowerCase().trim() === 'nacional') {
      // CORREÇÃO: Quando é especificamente "nacional", manter como nacional
      regionais = ['nacional'];
      console.log(`✅ Detectado "nacional" específico - mantendo como: ${JSON.stringify(regionais)}`);
    } else {
      // Dividir por vírgulas e mapear cada regional
      const regionaisList = regionaisStr.split(',').map(r => r.trim().toLowerCase());
      regionais = regionaisList.map(regional => {
        const mapped = mapeamentoAreas[regional] || regional;
        console.log(`🔄 Mapeando "${regional}" -> "${mapped}"`);
        return mapped;
      }).filter(Boolean);
      console.log(`✅ Regionais mapeadas: ${JSON.stringify(regionais)}`);
    }
  }
  
  return { ...goal, regionais };
}

// Simular MetasTab.tsx - Lógica de display
function simulateMetasTabDisplay(meta) {
  console.log(`\n🖥️ Simulando display para meta: "${meta.nome}"`);
  console.log(`📊 Regionais processadas: ${JSON.stringify(meta.regionais)}`);
  
  // Garantir que regionais seja sempre um array
  const regionaisArray = Array.isArray(meta.regionais) 
    ? meta.regionais 
    : (typeof meta.regionais === 'string' && meta.regionais.includes(','))
      ? meta.regionais.split(',').map(r => r.trim())
      : meta.regionais ? [meta.regionais] : [];
  
  console.log(`📋 regionaisArray: ${JSON.stringify(regionaisArray)}`);
  console.log(`📏 regionaisArray.length: ${regionaisArray.length}`);
  console.log(`📏 regionaisDisponiveis.length: ${regionaisDisponiveis.length}`);
  
  // Se tem todas as regionais disponíveis, mostrar "Todas"
  if (regionaisArray.length === regionaisDisponiveis.length) {
    console.log(`✅ Mostrando "Todas" (${regionaisArray.length} === ${regionaisDisponiveis.length})`);
    return 'Todas';
  }
  
  // Mapear chaves para nomes de display
  const regionaisDisplay = regionaisArray.map(key => {
    const displayName = REGIONAL_LABELS[key] || key;
    console.log(`🏷️ Mapeando chave "${key}" -> display "${displayName}"`);
    return displayName;
  });
  
  const result = regionaisDisplay.join(', ');
  console.log(`✅ Display final: "${result}"`);
  return result;
}

async function testCorrectedLogic() {
  console.log('🚀 Testando lógica CORRIGIDA do goalService.ts...\n');
  
  try {
    // 1. Buscar goals existentes no banco
    console.log('📊 Buscando goals no banco de dados...');
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar goals:', error);
      return;
    }
    
    console.log(`✅ Encontrados ${goals.length} goals no banco`);
    
    // 2. Processar cada goal com goalService.ts CORRIGIDO
    console.log('\n🔄 Processando goals com goalService.ts CORRIGIDO...');
    const processedGoals = goals.map(extractRegionaisFromGoalCorrected);
    
    // 3. Simular display com MetasTab.tsx
    console.log('\n🖥️ Simulando display com MetasTab.tsx...');
    processedGoals.forEach(meta => {
      const displayText = simulateMetasTabDisplay(meta);
      console.log(`\n📋 RESULTADO FINAL para "${meta.nome}": "${displayText}"`);
      console.log('─'.repeat(60));
    });
    
    // 4. Verificação específica
    console.log('\n✅ Verificação da correção:');
    processedGoals.forEach((goal, index) => {
      const displayText = simulateMetasTabDisplay(goal);
      const expected = goal.descricao.includes('Nacional') ? 'Nacional' : 
                      goal.descricao.includes('todas') ? 'Todas' : 'Outras';
      
      console.log(`${index + 1}. "${goal.nome}": ${displayText === expected ? '✅' : '❌'} ${displayText} (esperado: ${expected})`);
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testCorrectedLogic();