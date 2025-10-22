const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestInstituicao() {
  try {
    console.log('🏗️  Criando instituição de teste...\n');
    
    const testData = {
      nome: 'Instituição Teste - Múltiplos Programas',
      estado: 'SP',
      cidade: 'São Paulo',
      programa: 'Decolagem', // Campo antigo para compatibilidade
      programas: ['Decolagem', 'As Maras'], // Novo campo com múltiplos programas
      contato_nome: 'Teste',
      contato_email: 'teste@exemplo.com',
      contato_telefone: '(11) 99999-9999',
      endereco: 'Rua Teste, 123',
      cep: '01234-567',
      cnpj: '12.345.678/0001-90',
      site: 'https://teste.com',
      descricao: 'Instituição criada para testar múltiplos programas',
      ativa: true
    };
    
    const { data, error } = await supabase
      .from('instituicoes')
      .insert([testData])
      .select();
    
    if (error) {
      console.error('❌ Erro ao criar instituição:', error);
      return;
    }
    
    console.log('✅ Instituição criada com sucesso!');
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
      console.log('\n⚠️  Algo pode estar errado com a coluna programas...');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestInstituicao();