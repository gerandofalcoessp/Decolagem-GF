// Testar a correção do regex para extrair regionais

const goals = [
  {
    nome: "Ong Mara",
    descricao: "Meta: 104 unidades | Meses: todo-ano | Área: Nacional"
  },
  {
    nome: "Ong Decolagem",
    descricao: "Meta: 56 unidades | Meses: todo-ano | Área: Nacional"
  },
  {
    nome: "Ong Decolagem (Meta 3)",
    descricao: "Meta: 7 unidades | Meses: todo-ano | Área: Centro-Oeste, MG/ES, São Paulo, Sul, Rio de Janeiro, Norte, Nordeste 2, Nordeste 1"
  }
];

function testRegexExtraction(goal) {
  console.log(`\n🔍 Testando: ${goal.nome}`);
  console.log(`   Descrição: ${goal.descricao}`);
  
  // Regex corrigida (sem vírgula no padrão de exclusão)
  const regionaisMatch = goal.descricao.match(/(?:regional|regionais|área|áreas):\s*([^|\n]+)/i);
  
  if (regionaisMatch) {
    const regionaisStr = regionaisMatch[1].trim();
    console.log(`   ✅ Regionais extraídas: "${regionaisStr}"`);
    
    // Processar múltiplas regionais separadas por vírgula
    const areasArray = regionaisStr.split(',').map(area => area.trim());
    console.log(`   📋 Áreas separadas:`, areasArray);
    console.log(`   📊 Total de áreas: ${areasArray.length}`);
    
    // Mapear para chaves corretas
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
    
    const regionaisMapeadas = areasArray.map(area => {
      const areaLimpa = area.toLowerCase().trim();
      const mapped = mapeamentoAreas[areaLimpa] || areaLimpa;
      console.log(`     "${area}" -> "${areaLimpa}" -> "${mapped}"`);
      return mapped;
    }).filter(area => area);
    
    console.log(`   🎯 Regionais finais:`, regionaisMapeadas);
    console.log(`   📈 Total mapeadas: ${regionaisMapeadas.length}`);
    
    return regionaisMapeadas;
  } else {
    console.log(`   ❌ Nenhuma regional encontrada`);
    return [];
  }
}

function simulateDisplayLogic(regionais) {
  console.log(`\n📱 Simulando lógica de exibição:`);
  
  const totalRegionaisDisponiveis = 10; // Centro-Oeste, MG/ES, Nordeste 1, Nordeste 2, Norte, RJ, SP, Sul, Nacional, Comercial
  
  let displayText;
  if (regionais.length === totalRegionaisDisponiveis) {
    displayText = 'Todas';
    console.log(`   ✅ Condição 1: ${regionais.length} === ${totalRegionaisDisponiveis} -> "Todas"`);
  } else if (regionais.includes('nacional')) {
    displayText = 'Todas';
    console.log(`   ✅ Condição 2: inclui "nacional" -> "Todas"`);
  } else {
    displayText = regionais.join(', ');
    console.log(`   ❌ Nenhuma condição atendida -> "${displayText}"`);
  }
  
  console.log(`   🎯 RESULTADO: "${displayText}"`);
  return displayText;
}

console.log('🧪 Testando correção do regex para extração de regionais...\n');

goals.forEach((goal, index) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TESTE ${index + 1}: ${goal.nome}`);
  console.log(`${'='.repeat(60)}`);
  
  const regionais = testRegexExtraction(goal);
  const displayText = simulateDisplayLogic(regionais);
  
  console.log(`\n📊 RESUMO:`);
  console.log(`   Nome: ${goal.nome}`);
  console.log(`   Regionais extraídas: ${regionais.length}`);
  console.log(`   Exibição: "${displayText}"`);
  
  // Verificar se o resultado está correto
  if (goal.nome.includes('Meta 3')) {
    const expected = regionais.length === 8 && !displayText.includes('Todas');
    console.log(`   Status: ${expected ? '✅ CORRETO (8 regionais específicas)' : '❌ PROBLEMA'}`);
  } else {
    const expected = displayText === 'Todas';
    console.log(`   Status: ${expected ? '✅ CORRETO (Nacional -> Todas)' : '❌ PROBLEMA'}`);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log('🎯 RESULTADO DA CORREÇÃO');
console.log(`${'='.repeat(60)}`);
console.log('✅ Regex corrigida deve capturar todas as regionais após "Área:"');
console.log('✅ Meta 3 deve mostrar 8 regionais específicas, não "Todas"');
console.log('✅ Metas 1 e 2 devem continuar mostrando "Todas" (Nacional)');