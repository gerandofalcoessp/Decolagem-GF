// Simulação dos dados para testar a lógica de correção
console.log('=== TESTE DA CORREÇÃO DA LÓGICA DE CONTAGEM ===\n');

// Dados simulados das instituições (baseado no que encontramos no banco)
const instituicoes = [
  {
    id: 1,
    nome: "nordeste 1",
    regional: "nordeste_1",
    tipo_programa: "decolagem",
    programa: "decolagem",
    status: "ativo"
  }
];

// Dados simulados das atividades regionais (Nordeste 1 tem 0 atividades)
const atividadesRegionais = [];

console.log('DADOS SIMULADOS:');
console.log(`Instituições cadastradas: ${instituicoes.length}`);
console.log(`Atividades regionais: ${atividadesRegionais.length}`);
console.log('');

// Simulação da lógica ANTIGA (baseada em atividades)
function calcularInstituicoesAntigo(atividades, filtroRegional) {
  const atividadesDaRegional = atividades.filter(atividade => 
    atividade.regional?.toLowerCase() === filtroRegional.toLowerCase()
  );
  
  const atividadesPorTipo = atividadesDaRegional.reduce((acc, atividade) => {
    const tipo = atividade.atividade_label || atividade.titulo || 'Outros';
    if (!acc[tipo]) {
      acc[tipo] = 0;
    }
    acc[tipo] += parseInt(atividade.quantidade) || 0;
    return acc;
  }, {});
  
  const ligasMarasFormadas = atividadesPorTipo['Ligas Maras Formadas'] || 0;
  const familiasEmbarcadas = atividadesPorTipo['Famílias Embarcadas Decolagem'] || 0;
  const diagnosticosRealizados = atividadesPorTipo['Diagnósticos Realizados'] || 0;
  
  const temAtividadesMaras = ligasMarasFormadas > 0;
  const temAtividadesDecolagem = familiasEmbarcadas > 0 || diagnosticosRealizados > 0;
  
  const ongsMaras = temAtividadesMaras ? 1 : 0;
  const ongsDecolagem = temAtividadesDecolagem ? 1 : 0;
  const totalInstituicoes = Math.max(ongsMaras + ongsDecolagem, atividadesDaRegional.length > 0 ? 1 : 0);
  
  return {
    ongsMaras,
    ongsDecolagem,
    totalInstituicoes,
    ligasMarasFormadas,
    familiasEmbarcadas,
    diagnosticosRealizados
  };
}

// Simulação da lógica NOVA (baseada em instituições)
function calcularInstituicoesNovo(instituicoes, atividades, filtroRegional) {
  // Filtrar instituições da regional
  const instituicoesDaRegional = instituicoes.filter(inst => 
    inst.regional?.toLowerCase() === filtroRegional.toLowerCase()
  );
  
  // Contar por programa
  const ongsMaras = instituicoesDaRegional.filter(inst => 
    inst.tipo_programa?.toLowerCase().includes('maras') || 
    inst.programa?.toLowerCase().includes('maras')
  ).length;
  
  const ongsDecolagem = instituicoesDaRegional.filter(inst => 
    inst.tipo_programa?.toLowerCase().includes('decolagem') || 
    inst.programa?.toLowerCase().includes('decolagem')
  ).length;
  
  const totalInstituicoes = instituicoesDaRegional.length;
  
  // Manter o cálculo das atividades para os outros indicadores
  const atividadesDaRegional = atividades.filter(atividade => 
    atividade.regional?.toLowerCase() === filtroRegional.toLowerCase()
  );
  
  const atividadesPorTipo = atividadesDaRegional.reduce((acc, atividade) => {
    const tipo = atividade.atividade_label || atividade.titulo || 'Outros';
    if (!acc[tipo]) {
      acc[tipo] = 0;
    }
    acc[tipo] += parseInt(atividade.quantidade) || 0;
    return acc;
  }, {});
  
  const ligasMarasFormadas = atividadesPorTipo['Ligas Maras Formadas'] || 0;
  const familiasEmbarcadas = atividadesPorTipo['Famílias Embarcadas Decolagem'] || 0;
  const diagnosticosRealizados = atividadesPorTipo['Diagnósticos Realizados'] || 0;
  
  return {
    ongsMaras,
    ongsDecolagem,
    totalInstituicoes,
    ligasMarasFormadas,
    familiasEmbarcadas,
    diagnosticosRealizados
  };
}

// Testar para Nordeste 1
const filtroRegional = 'nordeste_1';

console.log('=== LÓGICA ANTIGA (baseada em atividades) ===');
const resultadoAntigo = calcularInstituicoesAntigo(atividadesRegionais, filtroRegional);
console.log(`Total de Instituições: ${resultadoAntigo.totalInstituicoes}`);
console.log(`ONGs Maras: ${resultadoAntigo.ongsMaras}`);
console.log(`ONGs Decolagem: ${resultadoAntigo.ongsDecolagem}`);
console.log(`Ligas Maras Formadas: ${resultadoAntigo.ligasMarasFormadas}`);
console.log(`Famílias Embarcadas: ${resultadoAntigo.familiasEmbarcadas}`);
console.log(`Diagnósticos Realizados: ${resultadoAntigo.diagnosticosRealizados}`);
console.log('');

console.log('=== LÓGICA NOVA (baseada em instituições) ===');
const resultadoNovo = calcularInstituicoesNovo(instituicoes, atividadesRegionais, filtroRegional);
console.log(`Total de Instituições: ${resultadoNovo.totalInstituicoes}`);
console.log(`ONGs Maras: ${resultadoNovo.ongsMaras}`);
console.log(`ONGs Decolagem: ${resultadoNovo.ongsDecolagem}`);
console.log(`Ligas Maras Formadas: ${resultadoNovo.ligasMarasFormadas}`);
console.log(`Famílias Embarcadas: ${resultadoNovo.familiasEmbarcadas}`);
console.log(`Diagnósticos Realizados: ${resultadoNovo.diagnosticosRealizados}`);
console.log('');

console.log('=== COMPARAÇÃO ===');
console.log(`Antes: Total de Instituições = ${resultadoAntigo.totalInstituicoes}`);
console.log(`Depois: Total de Instituições = ${resultadoNovo.totalInstituicoes}`);
console.log('');

if (resultadoNovo.totalInstituicoes > resultadoAntigo.totalInstituicoes) {
  console.log('✅ CORREÇÃO FUNCIONOU!');
  console.log('A nova lógica agora mostra o número correto de instituições baseado na tabela institutions.');
} else {
  console.log('❌ Problema na correção');
}

console.log('');
console.log('=== RESUMO DA CORREÇÃO ===');
console.log('1. Antes: Contava instituições baseado apenas na presença de atividades regionais');
console.log('2. Depois: Conta instituições diretamente da tabela institutions filtrada por regional');
console.log('3. Para Nordeste 1: Passou de 0 para 1 instituição (valor correto)');
console.log('4. Os indicadores de atividades (Ligas Maras, Famílias Embarcadas, etc.) continuam baseados nas atividades regionais');