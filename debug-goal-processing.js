// Simular o processamento do goalService.ts com os dados reais do banco

const goals = [
  {
    id: "c7b8e8c8-7b8e-4c8c-8c8c-4ed3f9507dac",
    nome: "Ong Mara",
    descricao: "Meta: 104 unidades | Meses: todo-ano | Área: Nacional",
    valor_meta: 104,
    valor_atual: 0,
    status: "pending"
  },
  {
    id: "06b08886-fc4a-452c-8337-0dcce2c92101", 
    nome: "Ong Decolagem",
    descricao: "Meta: 56 unidades | Meses: todo-ano | Área: Nacional",
    valor_meta: 56,
    valor_atual: 0,
    status: "pending"
  },
  {
    id: "9fe548a1-7d5e-4cc7-8beb-753eb2da7689",
    nome: "Ong Decolagem", 
    descricao: "Meta: 7 unidades | Meses: todo-ano | Área: Centro-Oeste, MG/ES, São Paulo, Sul, Rio de Janeiro, Norte, Nordeste 2, Nordeste 1",
    valor_meta: 7,
    valor_atual: 0,
    status: "pending"
  }
];

function adaptGoalToFrontend(goal) {
  console.log(`\n🔍 Processando meta: ${goal.nome}`);
  console.log(`   Descrição: ${goal.descricao}`);
  
  let regionais = [];
  
  // Extrair regionais da descrição (lógica do goalService.ts)
  const regionaisMatch = goal.descricao.match(/(?:regional|regionais|área|áreas):\s*([^|,\n]+)/i);
  if (regionaisMatch) {
    const regionaisStr = regionaisMatch[1].trim();
    console.log(`   Regionais extraídas: "${regionaisStr}"`);
    
    // Mapear os valores encontrados para as chaves corretas
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
    
    if (regionaisStr.toLowerCase().includes('todas') || regionaisStr.toLowerCase().includes('nacional')) {
      regionais = ['nacional'];
      console.log(`   Detectado "todas" ou "nacional" -> regionais = ["nacional"]`);
    } else {
      // Processar múltiplas regionais separadas por vírgula
      const areasArray = regionaisStr.split(',').map(area => area.trim());
      console.log(`   Áreas separadas por vírgula:`, areasArray);
      
      regionais = areasArray.map(area => {
        const areaLimpa = area.toLowerCase().trim();
        const mapped = mapeamentoAreas[areaLimpa] || areaLimpa;
        console.log(`     "${area}" -> "${areaLimpa}" -> "${mapped}"`);
        return mapped;
      }).filter(area => area);
    }
  }
  
  console.log(`   Regionais finais:`, regionais);
  console.log(`   Número de regionais:`, regionais.length);
  
  const frontendGoal = {
    id: goal.id,
    nome: goal.nome,
    descricao: goal.descricao,
    regionais: regionais,
    regional: regionais.join(', ') // Campo usado no DashboardMetasPage
  };
  
  console.log(`   Campo "regional" para exibição: "${frontendGoal.regional}"`);
  
  return frontendGoal;
}

function simulateMetasTabDisplay(frontendGoal) {
  console.log(`\n📱 Simulando exibição no MetasTab para: ${frontendGoal.nome}`);
  
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
  
  console.log(`   Regionais disponíveis: ${regionaisDisponiveis.length}`);
  console.log(`   Meta regionais:`, frontendGoal.regionais);
  
  // Lógica atual do MetasTab.tsx (após a correção)
  const regionaisArray = Array.isArray(frontendGoal.regionais) 
    ? frontendGoal.regionais 
    : (typeof frontendGoal.regionais === 'string' && frontendGoal.regionais.includes(','))
      ? frontendGoal.regionais.split(',').map(r => r.trim())
      : frontendGoal.regionais ? [frontendGoal.regionais] : [];
  
  console.log(`   Regionais processadas para exibição:`, regionaisArray);
  console.log(`   Número de regionais processadas: ${regionaisArray.length}`);
  
  let displayText;
  if (regionaisArray.length === regionaisDisponiveis.length) {
    displayText = 'Todas';
    console.log(`   ✅ Condição 1: ${regionaisArray.length} === ${regionaisDisponiveis.length} -> "Todas"`);
  } else if (regionaisArray.includes('nacional')) {
    displayText = 'Todas';
    console.log(`   ✅ Condição 2: inclui "nacional" -> "Todas"`);
  } else {
    displayText = regionaisArray.join(', ');
    console.log(`   ❌ Nenhuma condição atendida -> "${displayText}"`);
  }
  
  console.log(`   🎯 RESULTADO FINAL: "${displayText}"`);
  
  return displayText;
}

console.log('🧪 Debugando processamento de metas reais do banco...\n');

goals.forEach((goal, index) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`META ${index + 1}: ${goal.nome}`);
  console.log(`${'='.repeat(60)}`);
  
  const frontendGoal = adaptGoalToFrontend(goal);
  const displayText = simulateMetasTabDisplay(frontendGoal);
  
  console.log(`\n📊 RESUMO:`);
  console.log(`   Nome: ${goal.nome}`);
  console.log(`   Regionais processadas: ${frontendGoal.regionais.length}`);
  console.log(`   Exibição no card: "${displayText}"`);
  console.log(`   Status: ${displayText === 'Todas' ? '✅ CORRETO' : '❌ PROBLEMA'}`);
});

console.log(`\n${'='.repeat(60)}`);
console.log('🎯 ANÁLISE FINAL');
console.log(`${'='.repeat(60)}`);

console.log('\n🔍 Problemas identificados:');
console.log('1. Meta 3 tem 8 regionais específicas, mas não inclui "Nacional" nem "Comercial"');
console.log('2. Para exibir "Todas", precisa ter exatamente 10 regionais OU incluir "nacional"');
console.log('3. Meta 3 deveria exibir as regionais individuais, não "Todas"');

console.log('\n💡 Soluções possíveis:');
console.log('1. Se Meta 3 deveria ser "Todas": adicionar "Nacional" e "Comercial" na descrição');
console.log('2. Se Meta 3 está correta: verificar se a exibição individual está funcionando');
console.log('3. Verificar se o mapeamento de regionais está correto no frontend');