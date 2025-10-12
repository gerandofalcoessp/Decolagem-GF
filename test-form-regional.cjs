const REGIONAL_LABELS = {
  todas: 'Todas as Regionais',
  nacional: 'Nacional',
  comercial: 'Comercial',
  centro_oeste: 'Centro-Oeste',
  mg_es: 'MG/ES',
  nordeste_1: 'Nordeste 1',
  nordeste_2: 'Nordeste 2',
  norte: 'Norte',
  rj: 'RJ',
  sp: 'SP',
  sul: 'Sul',
};

console.log('🔍 Testando mapeamento do formulário:');
console.log('');

// Simular o que acontece quando o usuário seleciona "Centro-Oeste" no dropdown
Object.entries(REGIONAL_LABELS).forEach(([key, label]) => {
  console.log(`Opção: "${label}" -> Valor: "${key}"`);
});

console.log('');
console.log('✅ Quando o usuário seleciona "Centro-Oeste", o valor passado é: "centro_oeste"');
console.log('✅ Este valor deve ser usado no filtro de usuários');

// Testar o filtro
const REGIONAL_ALIASES = {
  nacional: ['nacional'],
  comercial: ['comercial'],
  centroeste: ['centroeste', 'centro-oeste', 'centrooeste', 'r. centro-oeste', 'r.centro-oeste'],
  nordeste: ['nordeste'],
  nordeste_2: ['nordeste2', 'nordeste 2', 'nordeste_2', 'r.nordeste2', 'r. nordeste 2', 'r.nordeste 2'],
  norte: ['norte'],
  rj: ['rj', 'riodejaneiro', 'rio de janeiro', 'r. rio de janeiro', 'r.rio de janeiro'],
  sp: ['sp', 'saopaulo', 'são paulo', 'sao paulo', 'r. sao paulo', 'r.sao paulo', 'r. são paulo', 'r.são paulo'],
  sul: ['sul'],
};

console.log('');
console.log('❌ PROBLEMA ENCONTRADO:');
console.log('- O formulário passa "centro_oeste" (com underscore)');
console.log('- Mas o REGIONAL_ALIASES usa "centroeste" (sem underscore)');
console.log('- Isso causa o mismatch!');

console.log('');
console.log('🔧 SOLUÇÃO: Adicionar "centro_oeste" ao REGIONAL_ALIASES ou corrigir a chave');