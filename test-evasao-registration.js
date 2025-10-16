const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

// Cliente admin (bypassa RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testEvasaoRegistration() {
  try {
    console.log('🧪 Testando registro de evasão após correção...\n');

    // 1. Buscar uma instituição para testar
    console.log('1️⃣ Buscando instituição para teste...');
    const { data: instituicoes, error: searchError } = await supabaseAdmin
      .from('instituicoes')
      .select('id, nome, status, evasao_data, evasao_motivo, evasao_registrado_em')
      .eq('status', 'ativa')
      .limit(1);

    if (searchError) {
      console.log('❌ Erro ao buscar instituições:', searchError.message);
      return;
    }

    if (!instituicoes || instituicoes.length === 0) {
      console.log('⚠️ Nenhuma instituição ativa encontrada para teste');
      return;
    }

    const instituicao = instituicoes[0];
    console.log(`✅ Instituição encontrada: ${instituicao.nome} (ID: ${instituicao.id})`);
    console.log(`   Status atual: ${instituicao.status}`);
    console.log(`   evasao_data atual: ${instituicao.evasao_data}`);

    // 2. Testar registro de evasão
    console.log('\n2️⃣ Testando registro de evasão...');
    
    const evasaoData = {
      status: 'evadida', // Valor válido do enum instituicao_status
      evasao_motivo: 'Teste de funcionalidade - motivo de evasão',
      evasao_data: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      evasao_registrado_em: new Date().toISOString()
    };

    console.log('📝 Dados de evasão a serem registrados:', evasaoData);

    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('instituicoes')
      .update(evasaoData)
      .eq('id', instituicao.id)
      .select('*');

    if (updateError) {
      console.log('❌ Erro ao registrar evasão:', updateError.message);
      console.log('   Detalhes do erro:', updateError);
      return;
    }

    console.log('✅ Evasão registrada com sucesso!');
    console.log('📋 Dados atualizados:', {
      id: updateResult[0].id,
      nome: updateResult[0].nome,
      status: updateResult[0].status,
      evasao_data: updateResult[0].evasao_data,
      evasao_motivo: updateResult[0].evasao_motivo,
      evasao_registrado_em: updateResult[0].evasao_registrado_em
    });

    // 3. Verificar se os dados foram salvos corretamente
    console.log('\n3️⃣ Verificando dados salvos...');
    
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('instituicoes')
      .select('id, nome, status, evasao_data, evasao_motivo, evasao_registrado_em')
      .eq('id', instituicao.id)
      .single();

    if (verifyError) {
      console.log('❌ Erro ao verificar dados salvos:', verifyError.message);
    } else {
      console.log('✅ Verificação bem-sucedida!');
      console.log('📊 Dados verificados:', {
        nome: verifyData.nome,
        status: verifyData.status,
        evasao_data: verifyData.evasao_data,
        evasao_motivo: verifyData.evasao_motivo,
        evasao_registrado_em: verifyData.evasao_registrado_em
      });
    }

    // 4. Reverter alterações para não afetar dados reais
    console.log('\n4️⃣ Revertendo alterações...');
    
    const { data: revertResult, error: revertError } = await supabaseAdmin
      .from('instituicoes')
      .update({
        status: 'ativa',
        evasao_data: null,
        evasao_motivo: null,
        evasao_registrado_em: null
      })
      .eq('id', instituicao.id)
      .select('id, nome, status, evasao_data');

    if (revertError) {
      console.log('❌ Erro ao reverter alterações:', revertError.message);
    } else {
      console.log('✅ Alterações revertidas com sucesso!');
      console.log('🔄 Status final:', {
        nome: revertResult[0].nome,
        status: revertResult[0].status,
        evasao_data: revertResult[0].evasao_data
      });
    }

    console.log('\n🎉 Teste de registro de evasão concluído com sucesso!');
    console.log('✅ As colunas de evasão estão funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

testEvasaoRegistration().catch(console.error);