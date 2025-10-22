const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Usar service role key para bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestWithServiceKey() {
  try {
    console.log('🏗️  Criando instituição de teste com service key...\n');
    
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
      
      // Se der erro de coluna não encontrada, vamos verificar a estrutura
      if (error.message.includes('programas')) {
        console.log('\n🔍 Verificando se a coluna programas realmente existe...');
        
        // Tentar inserir sem a coluna programas
        const testDataSemProgramas = { ...testData };
        delete testDataSemProgramas.programas;
        
        console.log('\n🔄 Tentando inserir sem a coluna programas...');
        const { data: dataSem, error: errorSem } = await supabase
          .from('instituicoes')
          .insert([testDataSemProgramas])
          .select();
        
        if (errorSem) {
          console.error('❌ Erro mesmo sem programas:', errorSem);
        } else {
          console.log('✅ Inserção funcionou SEM a coluna programas!');
          console.log('🔍 Isso confirma que a coluna programas NÃO existe na tabela.');
        }
      }
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
      console.log('\n⚠️  A coluna programas não foi salva ou não existe.');
      console.log('Valor salvo:', verificacao[0].programas);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestWithServiceKey();