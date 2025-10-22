// Script para testar a exibição de programas no frontend
console.log('🔍 Testando exibição de programas...');

// Simular dados das ONGs com múltiplos programas
const testOngs = [
  {
    nome: 'Associação Wise Madness',
    programa: 'decolagem',
    programas: ['as_maras', 'decolagem']
  },
  {
    nome: 'Instituto Recomeçar',
    programa: 'decolagem', 
    programas: ['as_maras', 'decolagem']
  },
  {
    nome: 'ONG Teste Único',
    programa: 'microcredito',
    programas: []
  }
];

// Função para obter label do programa
const getProgramaLabel = (programa) => {
  const labels = {
    as_maras: 'As Maras',
    microcredito: 'Microcrédito',
    decolagem: 'Decolagem'
  };
  return labels[programa] || programa;
};

// Função para exibir programas (mesma lógica do frontend)
const getProgramasDisplay = (ong) => {
  console.log(`\n🔍 Testando ${ong.nome}:`);
  console.log('  - programa:', ong.programa);
  console.log('  - programas:', ong.programas);
  console.log('  - programas.length:', ong.programas?.length);
  
  // Priorizar programas (múltiplos) sobre programa (único)
  if (ong.programas && ong.programas.length > 0) {
    const result = ong.programas.map(p => getProgramaLabel(p)).join(', ');
    console.log('  ✅ Resultado (múltiplos):', result);
    return result;
  }
  
  // Fallback para programa único
  if (ong.programa) {
    const result = getProgramaLabel(ong.programa);
    console.log('  ⚠️ Resultado (único):', result);
    return result;
  }
  
  console.log('  ❌ Nenhum programa encontrado');
  return '-';
};

// Testar cada ONG
testOngs.forEach(ong => {
  const display = getProgramasDisplay(ong);
  console.log(`\n📊 ${ong.nome}: "${display}"`);
});

console.log('\n✅ Teste concluído!');