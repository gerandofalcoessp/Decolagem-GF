const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_BASE = 'http://localhost:4000/api';

async function testMultipleProgramsWithValidCredentials() {
  console.log('🧪 Testando contabilização múltipla de ONGs com credenciais válidas...\n');
  
  try {
    // 1. Fazer login com credenciais que funcionaram nos testes
    console.log('1. 🔐 Fazendo login...');
    
    const possibleCredentials = [
      { email: 'flavio.almeida@gerandofalcoes.com', password: '123456' },
      { email: 'leo.martins@gerandofalcoes.com', password: '123456' },
      { email: 'coord.regional.sp@gerandofalcoes.com', password: '123456' }
    ];

    let loginSuccess = false;
    let token = null;
    let userEmail = null;

    for (const cred of possibleCredentials) {
      console.log(`   Tentando: ${cred.email}`);
      
      try {
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cred),
        });

        const loginData = await loginResponse.json();
        
        if (loginResponse.ok) {
          console.log(`   ✅ Login realizado com sucesso!`);
          token = loginData.session?.access_token || loginData.access_token || loginData.token;
          userEmail = cred.email;
          loginSuccess = true;
          break;
        } else {
          console.log(`   ❌ Falhou: ${loginData.error || 'Credenciais inválidas'}`);
        }
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      }
    }

    if (!loginSuccess) {
      console.error('❌ Não foi possível fazer login com nenhuma credencial');
      return;
    }

    console.log(`👤 Usuário logado: ${userEmail}`);
    console.log(`🔑 Token obtido: ${token ? 'Sim' : 'Não'}`);

    // 2. Buscar instituições diretamente do banco para análise
    console.log('\n2. 📊 Buscando instituições do banco de dados...');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: instituicoes, error } = await supabase
      .from('instituicoes')
      .select('*')
      .in('status', ['ativa', 'evadida']);

    if (error) {
      console.error('❌ Erro ao buscar instituições:', error.message);
      return;
    }

    console.log(`📋 Total de instituições encontradas: ${instituicoes.length}`);

    // 3. Analisar instituições com múltiplos programas
    console.log('\n3. 🔍 Analisando instituições com múltiplos programas...');
    
    const instituicoesComMultiplosProgramas = instituicoes.filter(inst => 
      inst.programas && Array.isArray(inst.programas) && inst.programas.length > 1
    );

    console.log(`📊 Instituições com múltiplos programas: ${instituicoesComMultiplosProgramas.length}`);
    
    if (instituicoesComMultiplosProgramas.length > 0) {
      console.log('\n📝 Exemplos de instituições com múltiplos programas:');
      instituicoesComMultiplosProgramas.slice(0, 3).forEach((inst, index) => {
        console.log(`   ${index + 1}. ${inst.nome_fantasia || inst.razao_social}`);
        console.log(`      Programas: ${inst.programas.join(', ')}`);
        console.log(`      Status: ${inst.status}`);
        console.log(`      Programa (singular): ${inst.programa || 'N/A'}`);
      });
    }

    // 4. Testar endpoint de estatísticas
    console.log('\n4. 🎯 Testando endpoint /api/instituicoes/stats...');
    
    const statsResponse = await fetch(`${API_BASE}/instituicoes/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!statsResponse.ok) {
      const errorData = await statsResponse.json();
      console.error(`❌ Erro no endpoint stats: ${statsResponse.status}`, errorData);
      return;
    }

    const statsData = await statsResponse.json();
    console.log('✅ Resposta do endpoint stats:');
    console.log(`   ONGs Maras: ${statsData.resumo?.ongsMaras || 0}`);
    console.log(`   ONGs Decolagem: ${statsData.resumo?.ongsDecolagem || 0}`);

    // 5. Fazer contagem manual para comparação
    console.log('\n5. 🧮 Fazendo contagem manual para comparação...');
    
    let manualMaras = 0;
    let manualDecolagem = 0;

    instituicoes.forEach(inst => {
      if (inst.status === 'ativa' || inst.status === 'evadida') {
        // Nova lógica: usar array programas se disponível, senão usar programa singular
        const programas = inst.programas && Array.isArray(inst.programas) && inst.programas.length > 0 
          ? inst.programas 
          : (inst.programa ? [inst.programa] : []);

        programas.forEach(programa => {
          if (programa === 'maras') {
            manualMaras++;
          } else if (programa === 'decolagem') {
            manualDecolagem++;
          }
        });
      }
    });

    console.log('📊 Contagem manual:');
    console.log(`   ONGs Maras: ${manualMaras}`);
    console.log(`   ONGs Decolagem: ${manualDecolagem}`);

    // 6. Comparar resultados
    console.log('\n6. ⚖️ Comparando resultados...');
    
    const apiMaras = statsData.resumo?.ongsMaras || 0;
    const apiDecolagem = statsData.resumo?.ongsDecolagem || 0;

    console.log('🔍 Comparação:');
    console.log(`   Maras - API: ${apiMaras}, Manual: ${manualMaras}, Match: ${apiMaras === manualMaras ? '✅' : '❌'}`);
    console.log(`   Decolagem - API: ${apiDecolagem}, Manual: ${manualDecolagem}, Match: ${apiDecolagem === manualDecolagem ? '✅' : '❌'}`);

    if (apiMaras === manualMaras && apiDecolagem === manualDecolagem) {
      console.log('\n🎉 Sucesso! A contabilização múltipla está funcionando corretamente!');
    } else {
      console.log('\n⚠️ Há diferenças entre a API e a contagem manual. Verifique a implementação.');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testMultipleProgramsWithValidCredentials();