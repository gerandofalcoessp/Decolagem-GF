require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

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

async function createTablesIndividually() {
  console.log('🚀 Criando tabelas individualmente...\n');

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
    )
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
    )
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
    )
  `;

  const { error: decolagemError } = await supabase.rpc('exec_sql', { sql: createDecolagem });
  if (decolagemError) {
    console.log(`   ⚠️  Erro: ${decolagemError.message}`);
  } else {
    console.log('   ✅ Tabela familias_decolagem criada');
  }

  // 4. Adicionar coluna current_value à tabela goals
  console.log('4. Adicionando coluna current_value à tabela goals...');
  const addCurrentValue = `ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS current_value NUMERIC DEFAULT 0`;

  const { error: currentValueError } = await supabase.rpc('exec_sql', { sql: addCurrentValue });
  if (currentValueError) {
    console.log(`   ⚠️  Erro: ${currentValueError.message}`);
  } else {
    console.log('   ✅ Coluna current_value adicionada');
  }

  // 5. Adicionar coluna type à tabela activities
  console.log('5. Adicionando coluna type à tabela activities...');
  const addType = `ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'general'`;

  const { error: typeError } = await supabase.rpc('exec_sql', { sql: addType });
  if (typeError) {
    console.log(`   ⚠️  Erro: ${typeError.message}`);
  } else {
    console.log('   ✅ Coluna type adicionada');
  }

  // 6. Habilitar RLS nas novas tabelas
  console.log('6. Habilitando RLS nas novas tabelas...');
  
  const enableRLS = [
    'ALTER TABLE public.emprestimos ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE public.participantes_asmaras ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE public.familias_decolagem ENABLE ROW LEVEL SECURITY'
  ];

  for (const sql of enableRLS) {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.log(`   ⚠️  Erro RLS: ${error.message}`);
    }
  }
  console.log('   ✅ RLS habilitado');

  // 7. Criar políticas básicas
  console.log('7. Criando políticas RLS básicas...');
  
  const policies = [
    // Emprestimos
    `CREATE POLICY IF NOT EXISTS "Users can view their own emprestimos" ON public.emprestimos
     FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE auth_user_id = auth.uid()))`,
    
    `CREATE POLICY IF NOT EXISTS "Users can insert their own emprestimos" ON public.emprestimos
     FOR INSERT WITH CHECK (member_id IN (SELECT id FROM public.members WHERE auth_user_id = auth.uid()))`,
    
    // Participantes Asmaras
    `CREATE POLICY IF NOT EXISTS "Users can view their own participantes_asmaras" ON public.participantes_asmaras
     FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE auth_user_id = auth.uid()))`,
    
    `CREATE POLICY IF NOT EXISTS "Users can insert their own participantes_asmaras" ON public.participantes_asmaras
     FOR INSERT WITH CHECK (member_id IN (SELECT id FROM public.members WHERE auth_user_id = auth.uid()))`,
    
    // Familias Decolagem
    `CREATE POLICY IF NOT EXISTS "Users can view their own familias_decolagem" ON public.familias_decolagem
     FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE auth_user_id = auth.uid()))`,
    
    `CREATE POLICY IF NOT EXISTS "Users can insert their own familias_decolagem" ON public.familias_decolagem
     FOR INSERT WITH CHECK (member_id IN (SELECT id FROM public.members WHERE auth_user_id = auth.uid()))`
  ];

  for (const policy of policies) {
    const { error } = await supabase.rpc('exec_sql', { sql: policy });
    if (error) {
      console.log(`   ⚠️  Erro política: ${error.message}`);
    }
  }
  console.log('   ✅ Políticas criadas');

  // 8. Verificar se tudo foi criado
  console.log('\n🔍 Verificando criação...');
  
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

  // Verificar colunas
  const { error: goalsError } = await supabase
    .from('goals')
    .select('current_value')
    .limit(1);

  if (goalsError) {
    console.log(`   ❌ goals.current_value: ${goalsError.message}`);
  } else {
    console.log('   ✅ goals.current_value: OK');
  }

  const { error: activitiesError } = await supabase
    .from('activities')
    .select('type')
    .limit(1);

  if (activitiesError) {
    console.log(`   ❌ activities.type: ${activitiesError.message}`);
  } else {
    console.log('   ✅ activities.type: OK');
  }

  console.log('\n🎉 Criação de tabelas concluída!');
}

// Executar
createTablesIndividually().catch(console.error);