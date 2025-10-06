require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurar cliente Supabase Admin
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMissingTables() {
  console.log('🚀 Aplicando criação de tabelas ausentes...\n');

  try {
    // 1. Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'create-missing-tables.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ Arquivo SQL não encontrado:', sqlPath);
      return;
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('📄 Script SQL carregado:', sqlPath);

    // 2. Executar o SQL usando rpc
    console.log('\n🔧 Executando criação de tabelas...');
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: sqlContent 
    });

    if (error) {
      console.error('❌ Erro ao executar SQL:', error.message);
      console.error('Código:', error.code);
      console.error('Detalhes:', error.details);
      
      // Tentar abordagem alternativa - executar partes do SQL separadamente
      console.log('\n🔄 Tentando abordagem alternativa...');
      await executeAlternativeApproach();
      return;
    }

    console.log('✅ Tabelas criadas com sucesso!');
    console.log('Resultado:', data);

    // 3. Verificar se as tabelas foram criadas
    await verifyTables();

  } catch (error) {
    console.error('❌ Erro durante aplicação:', error);
    console.log('\n🔄 Tentando abordagem alternativa...');
    await executeAlternativeApproach();
  }
}

async function executeAlternativeApproach() {
  console.log('📋 Executando criação de tabelas individualmente...\n');

  // 1. Criar tabela emprestimos
  console.log('1. Criando tabela emprestimos...');
  const createEmprestimos = `
    CREATE TABLE IF NOT EXISTS public.emprestimos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
      valor DECIMAL(10,2) NOT NULL,
      taxa_juros DECIMAL(5,2) DEFAULT 0,
      prazo_meses INTEGER NOT NULL,
      data_emprestimo DATE NOT NULL DEFAULT CURRENT_DATE,
      data_vencimento DATE,
      status VARCHAR(20) DEFAULT 'ativo',
      observacoes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  const { error: emprestimosError } = await supabase.rpc('exec_sql', { sql: createEmprestimos });
  if (emprestimosError) {
    console.log(`   ⚠️  Erro: ${emprestimosError.message}`);
  } else {
    console.log('   ✅ Tabela emprestimos criada');
  }

  // 2. Criar tabela participantes_asmaras
  console.log('2. Criando tabela participantes_asmaras...');
  const createAsmaras = `
    CREATE TABLE IF NOT EXISTS public.participantes_asmaras (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
      nome VARCHAR(255) NOT NULL,
      idade INTEGER,
      genero VARCHAR(20),
      telefone VARCHAR(20),
      endereco TEXT,
      data_ingresso DATE DEFAULT CURRENT_DATE,
      status VARCHAR(20) DEFAULT 'ativo',
      observacoes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  const { error: asmarasError } = await supabase.rpc('exec_sql', { sql: createAsmaras });
  if (asmarasError) {
    console.log(`   ⚠️  Erro: ${asmarasError.message}`);
  } else {
    console.log('   ✅ Tabela participantes_asmaras criada');
  }

  // 3. Criar tabela familias_decolagem
  console.log('3. Criando tabela familias_decolagem...');
  const createDecolagem = `
    CREATE TABLE IF NOT EXISTS public.familias_decolagem (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
      nome_responsavel VARCHAR(255) NOT NULL,
      numero_membros INTEGER DEFAULT 1,
      renda_familiar DECIMAL(10,2),
      endereco TEXT,
      telefone VARCHAR(20),
      data_cadastro DATE DEFAULT CURRENT_DATE,
      status VARCHAR(20) DEFAULT 'ativo',
      observacoes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  const { error: decolagemError } = await supabase.rpc('exec_sql', { sql: createDecolagem });
  if (decolagemError) {
    console.log(`   ⚠️  Erro: ${decolagemError.message}`);
  } else {
    console.log('   ✅ Tabela familias_decolagem criada');
  }

  // 4. Adicionar colunas ausentes
  console.log('4. Adicionando colunas ausentes...');
  
  // Adicionar current_value à tabela goals
  const addCurrentValue = `
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'goals' AND column_name = 'current_value' AND table_schema = 'public') THEN
            ALTER TABLE public.goals ADD COLUMN current_value NUMERIC DEFAULT 0;
        END IF;
    END $$;
  `;

  const { error: currentValueError } = await supabase.rpc('exec_sql', { sql: addCurrentValue });
  if (currentValueError) {
    console.log(`   ⚠️  Erro ao adicionar current_value: ${currentValueError.message}`);
  } else {
    console.log('   ✅ Coluna current_value adicionada');
  }

  // Adicionar type à tabela activities
  const addType = `
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'activities' AND column_name = 'type' AND table_schema = 'public') THEN
            ALTER TABLE public.activities ADD COLUMN type VARCHAR(50) DEFAULT 'general';
        END IF;
    END $$;
  `;

  const { error: typeError } = await supabase.rpc('exec_sql', { sql: addType });
  if (typeError) {
    console.log(`   ⚠️  Erro ao adicionar type: ${typeError.message}`);
  } else {
    console.log('   ✅ Coluna type adicionada');
  }

  await verifyTables();
}

async function verifyTables() {
  console.log('\n🔍 Verificando tabelas criadas...');

  const tables = ['emprestimos', 'participantes_asmaras', 'familias_decolagem'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .limit(1);

    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ ${table}: OK`);
    }
  }

  // Verificar colunas adicionadas
  console.log('\n🔍 Verificando colunas adicionadas...');
  
  // Testar goals.current_value
  const { error: goalsError } = await supabase
    .from('goals')
    .select('current_value')
    .limit(1);

  if (goalsError) {
    console.log(`   ❌ goals.current_value: ${goalsError.message}`);
  } else {
    console.log('   ✅ goals.current_value: OK');
  }

  // Testar activities.type
  const { error: activitiesError } = await supabase
    .from('activities')
    .select('type')
    .limit(1);

  if (activitiesError) {
    console.log(`   ❌ activities.type: ${activitiesError.message}`);
  } else {
    console.log('   ✅ activities.type: OK');
  }

  console.log('\n🎉 Verificação concluída!');
}

// Executar aplicação
applyMissingTables().catch(console.error);