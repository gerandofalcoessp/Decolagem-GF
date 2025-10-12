// Script para testar exclusão de atividades em diferentes cards regionais
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeamento de regionais para testar
const REGIONAIS_PARA_TESTAR = [
  { id: 'nacional', nome: 'Nacional' },
  { id: 'comercial', nome: 'Comercial' },
  { id: 'centro_oeste', nome: 'Centro-Oeste' },
  { id: 'mg_es', nome: 'MG/ES' },
  { id: 'nordeste_1', nome: 'Nordeste 1' },
  { id: 'nordeste_2', nome: 'Nordeste 2' },
  { id: 'norte', nome: 'Norte' },
  { id: 'rj', nome: 'Rio de Janeiro' },
  { id: 'sp', nome: 'São Paulo' },
  { id: 'sul', nome: 'Sul' },
  { id: 'sudeste', nome: 'Sudeste' },
  { id: 'nordeste', nome: 'Nordeste' }
];

async function testRegionalCardsDeletion() {
  console.log('🧪 Testando exclusão de atividades em diferentes cards regionais...\n');
  
  const resultados = [];
  
  try {
    // 1. Login como Deise (usuário de teste)
    console.log('1️⃣ Fazendo login como Deise...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'coord.regional.co@gerandofalcoes.com',
      password: 'senha123'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }

    console.log('✅ Login realizado com sucesso');
    const token = authData.session.access_token;

    // 2. Para cada regional, criar uma atividade e tentar excluir
    for (const regional of REGIONAIS_PARA_TESTAR) {
      console.log(`\n🔍 Testando regional: ${regional.nome} (${regional.id})`);
      
      const resultado = {
        regional: regional.nome,
        regionalId: regional.id,
        criacaoSucesso: false,
        exclusaoSucesso: false,
        errosCriacao: [],
        errosExclusao: [],
        atividadeId: null
      };

      try {
        // 2.1. Criar atividade de teste
        console.log(`   📝 Criando atividade de teste para ${regional.nome}...`);
        
        const novaAtividade = {
          title: `TESTE - Exclusão ${regional.nome}`,
          description: `Atividade de teste para verificar exclusão na regional ${regional.nome}`,
          type: 'reuniao_regional',
          activity_date: new Date().toISOString().split('T')[0],
          programa: 'gf_jovem',
          regional: regional.id,
          estados: ['SP'], // Estado padrão para teste
          quantidade: 1,
          atividadeLabel: 'Reunião Regional',
          atividadeCustomLabel: ''
        };

        const responseCriacao = await fetch('http://localhost:4000/api/regional-activities', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(novaAtividade)
        });

        if (responseCriacao.ok) {
          const dadosCriacao = await responseCriacao.json();
          resultado.criacaoSucesso = true;
          resultado.atividadeId = dadosCriacao.data.id;
          console.log(`   ✅ Atividade criada: ${resultado.atividadeId}`);
        } else {
          const errorData = await responseCriacao.text();
          resultado.errosCriacao.push(`Status ${responseCriacao.status}: ${errorData}`);
          console.log(`   ❌ Erro na criação: ${responseCriacao.status} - ${errorData}`);
        }

        // 2.2. Tentar excluir a atividade
        if (resultado.criacaoSucesso && resultado.atividadeId) {
          console.log(`   🗑️ Tentando excluir atividade ${resultado.atividadeId}...`);
          
          const responseExclusao = await fetch(`http://localhost:4000/api/regional-activities/${resultado.atividadeId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });

          if (responseExclusao.ok) {
            resultado.exclusaoSucesso = true;
            console.log(`   ✅ Exclusão bem-sucedida`);
          } else {
            const errorData = await responseExclusao.text();
            resultado.errosExclusao.push(`Status ${responseExclusao.status}: ${errorData}`);
            console.log(`   ❌ Erro na exclusão: ${responseExclusao.status} - ${errorData}`);
          }
        }

      } catch (error) {
        console.log(`   ❌ Erro geral para ${regional.nome}:`, error.message);
        resultado.errosCriacao.push(error.message);
      }

      resultados.push(resultado);
      
      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 3. Análise dos resultados
    console.log('\n📊 ANÁLISE DOS RESULTADOS:\n');
    
    const sucessos = resultados.filter(r => r.criacaoSucesso && r.exclusaoSucesso);
    const falhas = resultados.filter(r => !r.criacaoSucesso || !r.exclusaoSucesso);
    
    console.log(`✅ Regionais com exclusão funcionando: ${sucessos.length}/${resultados.length}`);
    sucessos.forEach(r => console.log(`   - ${r.regional} (${r.regionalId})`));
    
    console.log(`\n❌ Regionais com problemas: ${falhas.length}/${resultados.length}`);
    falhas.forEach(r => {
      console.log(`   - ${r.regional} (${r.regionalId}):`);
      if (!r.criacaoSucesso) {
        console.log(`     • Erro na criação: ${r.errosCriacao.join(', ')}`);
      }
      if (r.criacaoSucesso && !r.exclusaoSucesso) {
        console.log(`     • Erro na exclusão: ${r.errosExclusao.join(', ')}`);
      }
    });

    // 4. Identificar padrões
    console.log('\n🔍 PADRÕES IDENTIFICADOS:');
    
    const errosExclusao = falhas.filter(r => r.criacaoSucesso && !r.exclusaoSucesso);
    if (errosExclusao.length > 0) {
      console.log(`\n🚨 ${errosExclusao.length} regionais têm problema específico na exclusão:`);
      errosExclusao.forEach(r => {
        console.log(`   - ${r.regional}: ${r.errosExclusao[0]}`);
      });
    }

    const errosCriacao = falhas.filter(r => !r.criacaoSucesso);
    if (errosCriacao.length > 0) {
      console.log(`\n📝 ${errosCriacao.length} regionais têm problema na criação:`);
      errosCriacao.forEach(r => {
        console.log(`   - ${r.regional}: ${r.errosCriacao[0]}`);
      });
    }

    // 5. Verificar permissões do usuário
    console.log('\n👤 VERIFICANDO PERMISSÕES DO USUÁRIO:');
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userData?.user) {
      console.log(`   - User ID: ${userData.user.id}`);
      console.log(`   - Email: ${userData.user.email}`);
      console.log(`   - Metadata:`, userData.user.user_metadata);
    }

    // Buscar dados do member
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', userData?.user?.id)
      .single();

    if (memberData) {
      console.log(`   - Member ID: ${memberData.id}`);
      console.log(`   - Regional: ${memberData.regional}`);
      console.log(`   - Função: ${memberData.funcao}`);
      console.log(`   - Role: ${memberData.role}`);
    } else {
      console.log(`   - ❌ Dados do member não encontrados:`, memberError?.message);
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

testRegionalCardsDeletion().catch(console.error);