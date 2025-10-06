const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestInstituicoes() {
  try {
    console.log('🔧 Criando dados de teste para instituições...\n');
    
    const testData = [
      // ONGs As Maras
      {
        nome: 'ONG As Maras - São Paulo',
        cnpj: '11.111.111/0001-11',
        endereco: 'Rua das Flores, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567',
        telefone: '(11) 9999-1111',
        email: 'contato@asmaras-sp.org',
        nome_lider: 'Ana Silva',
        regional: 'sp',
        programa: 'as_maras',
        status: 'ativa',
        observacoes: 'ONG focada no empoderamento feminino'
      },
      {
        nome: 'As Maras Nordeste',
        cnpj: '22.222.222/0001-22',
        endereco: 'Av. Boa Viagem, 456',
        cidade: 'Recife',
        estado: 'PE',
        cep: '51020-000',
        telefone: '(81) 9999-2222',
        email: 'contato@asmaras-ne.org',
        nome_lider: 'Maria Santos',
        regional: 'nordeste_1',
        programa: 'as_maras',
        status: 'ativa',
        observacoes: 'Atuação no nordeste brasileiro'
      },
      {
        nome: 'As Maras Rio de Janeiro',
        cnpj: '33.333.333/0001-33',
        endereco: 'Rua Copacabana, 789',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        cep: '22070-000',
        telefone: '(21) 9999-3333',
        email: 'contato@asmaras-rj.org',
        nome_lider: 'Carla Oliveira',
        regional: 'rj',
        programa: 'as_maras',
        status: 'ativa',
        observacoes: 'Foco em comunidades cariocas'
      },
      
      // ONGs Decolagem
      {
        nome: 'Decolagem Sul',
        cnpj: '44.444.444/0001-44',
        endereco: 'Rua Gaúcha, 321',
        cidade: 'Porto Alegre',
        estado: 'RS',
        cep: '90000-000',
        telefone: '(51) 9999-4444',
        email: 'contato@decolagem-sul.org',
        nome_lider: 'João Pereira',
        regional: 'sul',
        programa: 'decolagem',
        status: 'ativa',
        observacoes: 'Programa de aceleração no sul'
      },
      {
        nome: 'Decolagem Centro-Oeste',
        cnpj: '55.555.555/0001-55',
        endereco: 'Av. das Nações, 654',
        cidade: 'Brasília',
        estado: 'DF',
        cep: '70000-000',
        telefone: '(61) 9999-5555',
        email: 'contato@decolagem-co.org',
        nome_lider: 'Pedro Costa',
        regional: 'centro_oeste',
        programa: 'decolagem',
        status: 'ativa',
        observacoes: 'Atuação no centro-oeste'
      },
      {
        nome: 'Decolagem Norte',
        cnpj: '66.666.666/0001-66',
        endereco: 'Rua Amazônica, 987',
        cidade: 'Manaus',
        estado: 'AM',
        cep: '69000-000',
        telefone: '(92) 9999-6666',
        email: 'contato@decolagem-norte.org',
        nome_lider: 'Ana Ribeiro',
        regional: 'norte',
        programa: 'decolagem',
        status: 'ativa',
        observacoes: 'Programa na região norte'
      },
      
      // ONGs Microcrédito
      {
        nome: 'Microcrédito Nacional',
        cnpj: '77.777.777/0001-77',
        endereco: 'Rua Central, 147',
        cidade: 'Brasília',
        estado: 'DF',
        cep: '70100-000',
        telefone: '(61) 9999-7777',
        email: 'contato@microcredito-nacional.org',
        nome_lider: 'Carlos Mendes',
        regional: 'nacional',
        programa: 'microcredito',
        status: 'ativa',
        observacoes: 'Programa nacional de microcrédito'
      },
      {
        nome: 'Microcrédito Nordeste',
        cnpj: '88.888.888/0001-88',
        endereco: 'Av. Nordestina, 258',
        cidade: 'Salvador',
        estado: 'BA',
        cep: '40000-000',
        telefone: '(71) 9999-8888',
        email: 'contato@microcredito-ne.org',
        nome_lider: 'Lucia Ferreira',
        regional: 'nordeste_2',
        programa: 'microcredito',
        status: 'ativa',
        observacoes: 'Microcrédito para o nordeste'
      }
    ];

    console.log(`📊 Inserindo ${testData.length} instituições de teste...`);
    
    for (let i = 0; i < testData.length; i++) {
      const instituicao = testData[i];
      console.log(`\n${i + 1}. Inserindo: ${instituicao.nome} (${instituicao.programa} - ${instituicao.regional})`);
      
      const { data, error } = await supabase
        .from('instituicoes')
        .insert(instituicao)
        .select('id, nome, programa, regional')
        .single();
      
      if (error) {
        console.error(`❌ Erro ao inserir ${instituicao.nome}:`, error.message);
      } else {
        console.log(`✅ Inserido com sucesso: ID ${data.id}`);
      }
    }
    
    // Verificar totais após inserção
    console.log('\n📈 Verificando totais após inserção...');
    
    const { count: total } = await supabase
      .from('instituicoes')
      .select('*', { count: 'exact', head: true });
    
    const { data: programas } = await supabase
      .from('instituicoes')
      .select('programa');
    
    const { data: regionais } = await supabase
      .from('instituicoes')
      .select('regional');
    
    const programCounts = programas.reduce((acc, item) => {
      acc[item.programa] = (acc[item.programa] || 0) + 1;
      return acc;
    }, {});
    
    const regionalCounts = regionais.reduce((acc, item) => {
      acc[item.regional] = (acc[item.regional] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Estatísticas finais:');
    console.log(`Total de instituições: ${total}`);
    console.log('\nPor programa:');
    Object.entries(programCounts).forEach(([programa, count]) => {
      console.log(`  ${programa}: ${count}`);
    });
    console.log('\nPor regional:');
    Object.entries(regionalCounts).forEach(([regional, count]) => {
      console.log(`  ${regional}: ${count}`);
    });
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

createTestInstituicoes();