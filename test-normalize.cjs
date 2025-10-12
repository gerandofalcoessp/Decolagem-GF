// Teste de normalização e matching
const normalize = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

const REGIONAL_ALIASES = {
  nacional: ['nacional'],
  centroeste: ['centroeste', 'centro-oeste', 'centrooeste', 'r. centro-oeste', 'r.centro-oeste'],
  nordeste: ['nordeste'],
  nordeste_2: ['nordeste2', 'nordeste 2', 'nordeste_2', 'r.nordeste2', 'r. nordeste 2', 'r.nordeste 2'],
  norte: ['norte'],
  rj: ['rj', 'riodejaneiro', 'rio de janeiro', 'r. rio de janeiro', 'r.rio de janeiro'],
  sp: ['sp', 'saopaulo', 'são paulo', 'sao paulo', 'r. sao paulo', 'r.sao paulo', 'r. são paulo', 'r.são paulo'],
  sul: ['sul'],
};

console.log('🔍 Testando normalização e matching para Centro-Oeste');

const userRegional = 'R. Centro-Oeste';
const normalizedUserRegional = normalize(userRegional);

console.log(`Original: "${userRegional}"`);
console.log(`Normalizado: "${normalizedUserRegional}"`);

const regionalKey = 'centroeste';
const matchers = REGIONAL_ALIASES[regionalKey] || [];

console.log(`Matchers para ${regionalKey}:`, matchers);

const normalizedMatchers = matchers.map(m => normalize(m));
console.log('Matchers normalizados:', normalizedMatchers);

const byRegional = matchers.some((m) => normalizedUserRegional.includes(normalize(m)));
console.log(`Match encontrado: ${byRegional}`);

// Teste individual de cada matcher
console.log('\n🔍 Teste individual de cada matcher:');
matchers.forEach(matcher => {
  const normalizedMatcher = normalize(matcher);
  const includes = normalizedUserRegional.includes(normalizedMatcher);
  console.log(`  "${matcher}" -> "${normalizedMatcher}" -> includes: ${includes}`);
});

// Teste reverso
console.log('\n🔍 Teste reverso (matcher includes user):');
matchers.forEach(matcher => {
  const normalizedMatcher = normalize(matcher);
  const includes = normalizedMatcher.includes(normalizedUserRegional);
  console.log(`  "${normalizedMatcher}" includes "${normalizedUserRegional}": ${includes}`);
});