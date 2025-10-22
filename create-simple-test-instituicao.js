const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createSimpleTestInstituicao() {
  try {
    console.log('🏗️  Criando instituição de teste simples...\n');
    
    // Dados baseados na estrutura real da tabela
    const testData = {
      nome: 'Instituição Teste - Múltiplos Programas',
      estado: 'SP',
      cidade: 'São Paulo',
      programa: 'decolagem', // Campo obrigatório usando enum
      programas: ['decolagem', 'as_maras'], // Novo campo com múltiplos programas
      cnpj: '12.345.678/0001-90',
      endereco: 'Rua Teste, 123',
      cep: '01234-567',
      telefone: '(11) 99999-9999',
      email: 'teste@exemplo.com',
      regional: 'sp', // Campo obrigatório usando enum
      status: 'ativa', // Campo obrigatório usando enum
      observacoes: 'Instituição criada para testar múltiplos programas',
      nome_lider: 'Líder Teste'
    };
    
    console.log('📋 Dados que serão inseridos:');
    console.log(JSON.stringify(testData, null, 2));
    
    const { data, error } = await supabase
      .from('instituicoes')
      .insert([testData])
      .select();
    
    if (error) {
      console.error('❌ Erro ao criar instituição:', error);
      return;
    }
    
    console.log('\n✅ Instituição criada com sucesso!');
    console.log('📋 Dados criados:');
    console.log(JSON.stringify(data[0], null, 2));
    
    // Verificar se foi salvo corretamente
    const { data: verificacao, error: errorVerif } = await supabase
      .from('instituicoes')
      .select('*')
      .eq('id', data[0].id);
    
    if (errorVerif) {
      console.error('❌ Erro ao verificar dados:', errorVerif);
      return;
    }
    
    console.log('\n🔍 Verificação dos dados salvos:');
    console.log(`Nome: ${verificacao[0].nome}`);
    console.log(`Programa (único): ${verificacao[0].programa}`);
    console.log(`Programas (múltiplos): ${JSON.stringify(verificacao[0].programas)}`);
    
    if (verificacao[0].programas && verificacao[0].programas.length > 1) {
      console.log('\n🎉 SUCESSO! A coluna programas está funcionando corretamente!');
    } else {
      console.log('\n⚠️  Verificando se a coluna programas foi salva...');
      console.log('Valor salvo:', verificacao[0].programas);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createSimpleTestInstituicao();