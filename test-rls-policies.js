const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

// Cliente com service role (bypassa RLS)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

// Cliente com anon key (sujeito a RLS)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function testRLSPolicies() {
  console.log('🔍 Testando políticas RLS na tabela instituicoes...\n');

  try {
    // 1. Testar com service role (deve ver todos os dados)
    console.log('1. 🔑 Testando com SERVICE ROLE (bypassa RLS)...');
    const { data: dataService, error: errorService } = await supabaseService
      .from('instituicoes')
      .select('id, nome, status, programa, programas, regional')
      .in('status', ['ativa', 'evadida']);

    if (errorService) {
      console.error('❌ Erro com service role:', errorService);
    } else {
      console.log(`✅ Service role - Total: ${dataService.length} instituições`);
      
      const ativasDecolagem = dataService.filter(inst => 
        inst.status === 'ativa' && 
        ((inst.programas && inst.programas.includes('decolagem')) || inst.programa === 'decolagem')
      );
      console.log(`   ONGs Decolagem ativas: ${ativasDecolagem.length}`);
    }

    // 2. Testar com anon key (sujeito a RLS)
    console.log('\n2. 🔓 Testando com ANON KEY (sujeito a RLS)...');
    const { data: dataAnon, error: errorAnon } = await supabaseAnon
      .from('instituicoes')
      .select('id, nome, status, programa, programas, regional')
      .in('status', ['ativa', 'evadida']);

    if (errorAnon) {
      console.error('❌ Erro com anon key:', errorAnon);
    } else {
      console.log(`✅ Anon key - Total: ${dataAnon.length} instituições`);
      
      const ativasDecolagem = dataAnon.filter(inst => 
        inst.status === 'ativa' && 
        ((inst.programas && inst.programas.includes('decolagem')) || inst.programa === 'decolagem')
      );
      console.log(`   ONGs Decolagem ativas: ${ativasDecolagem.length}`);
    }

    // 3. Testar com usuário autenticado
    console.log('\n3. 👤 Testando com USUÁRIO AUTENTICADO...');
    
    // Fazer login
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: 'flavio.almeida@gerandofalcoes.com',
      password: '123456'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }

    console.log(`✅ Login realizado: ${authData.user.email}`);
    
    // Buscar dados com usuário autenticado
    const { data: dataAuth, error: errorAuth } = await supabaseAnon
      .from('instituicoes')
      .select('id, nome, status, programa, programas, regional')
      .in('status', ['ativa', 'evadida']);

    if (errorAuth) {
      console.error('❌ Erro com usuário autenticado:', errorAuth);
    } else {
      console.log(`✅ Usuário autenticado - Total: ${dataAuth.length} instituições`);
      
      const ativasDecolagem = dataAuth.filter(inst => 
        inst.status === 'ativa' && 
        ((inst.programas && inst.programas.includes('decolagem')) || inst.programa === 'decolagem')
      );
      console.log(`   ONGs Decolagem ativas: ${ativasDecolagem.length}`);
    }

    // 4. Comparar resultados
    console.log('\n4. 📊 COMPARAÇÃO DE RESULTADOS:');
    console.log(`   Service Role: ${dataService?.length || 0} instituições`);
    console.log(`   Anon Key: ${dataAnon?.length || 0} instituições`);
    console.log(`   Usuário Autenticado: ${dataAuth?.length || 0} instituições`);

    if (dataService?.length !== dataAuth?.length) {
      console.log('\n⚠️ DIFERENÇA DETECTADA! Há políticas RLS limitando o acesso.');
    } else {
      console.log('\n✅ Sem diferenças - RLS não está limitando o acesso.');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testRLSPolicies();