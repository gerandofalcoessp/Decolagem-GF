// Teste final para verificar se a correção funcionou
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

const REGIONAL_ALIASES = {
  nacional: ['nacional'],
  centroeste: ['centroeste', 'centro-oeste', 'centrooeste', 'r. centro-oeste', 'r.centro-oeste'],
  centro_oeste: ['centroeste', 'centro-oeste', 'centrooeste', 'r. centro-oeste', 'r.centro-oeste'],
  nordeste: ['nordeste'],
  nordeste_2: ['nordeste2', 'nordeste 2', 'nordeste_2', 'r.nordeste2', 'r. nordeste 2', 'r.nordeste 2'],
  norte: ['norte'],
  rj: ['rj', 'riodejaneiro', 'rio de janeiro', 'r. rio de janeiro', 'r.rio de janeiro'],
  sp: ['sp', 'saopaulo', 'são paulo', 'sao paulo', 'r. sao paulo', 'r.sao paulo', 'r. são paulo', 'r.são paulo'],
  sul: ['sul'],
};

const normalize = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

console.log('🔧 TESTE FINAL - Verificando se a correção funcionou:');
console.log('');

// Simular usuários Centro-Oeste
const testUsers = [
  { id: 1, nome: 'Deise', regional: 'R. Centro-Oeste' },
  { id: 2, nome: 'Flávio Almeida', regional: 'R. Centro-Oeste' }
];

// Simular seleção do formulário
const formRegional = 'centro_oeste'; // Valor que vem do formulário

console.log(`📋 Formulário selecionado: "${formRegional}"`);
console.log(`🔍 Aliases disponíveis para "${formRegional}":`, REGIONAL_ALIASES[formRegional]);
console.log('');

// Testar filtro
const filteredUsers = testUsers.filter(user => {
  const userRegional = user.regional || '';
  const normalizedUserRegional = normalize(userRegional);
  
  console.log(`👤 Testando usuário: ${user.nome}`);
  console.log(`   Regional original: "${userRegional}"`);
  console.log(`   Regional normalizada: "${normalizedUserRegional}"`);
  
  const matchers = REGIONAL_ALIASES[formRegional] || [];
  const matches = matchers.some(m => normalizedUserRegional.includes(m));
  
  console.log(`   Matchers: [${matchers.join(', ')}]`);
  console.log(`   Match encontrado: ${matches}`);
  console.log('');
  
  return matches;
});

console.log('🎯 RESULTADO:');
console.log(`✅ Usuários filtrados: ${filteredUsers.length}`);
filteredUsers.forEach(user => {
  console.log(`   - ${user.nome} (${user.regional})`);
});

if (filteredUsers.length === 2) {
  console.log('');
  console.log('🎉 SUCESSO! A correção funcionou!');
  console.log('✅ Ambos os usuários Centro-Oeste foram encontrados');
} else {
  console.log('');
  console.log('❌ PROBLEMA: Nem todos os usuários foram encontrados');
}