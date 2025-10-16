const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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

async function addEvasaoColumns() {
  try {
    console.log('🔧 Adicionando colunas de evasão na tabela instituicoes...\n');

    // 1. Verificar colunas existentes antes
    console.log('1️⃣ Verificando colunas existentes...');
    const checkColumnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'instituicoes' 
      AND table_schema = 'public'
      AND column_name IN ('evasao_data', 'evasao_motivo', 'evasao_registrado_em')
      ORDER BY column_name;
    `;

    const { data: existingColumns, error: checkError } = await supabaseAdmin.rpc('exec_sql', {
      sql: checkColumnsQuery
    });

    if (checkError) {
      console.log('❌ Erro ao verificar colunas existentes:', checkError.message);
    } else {
      console.log('📊 Colunas existentes:', existingColumns);
    }

    // 2. Adicionar as colunas
    console.log('\n2️⃣ Adicionando colunas de evasão...');
    
    const addColumnsQuery = `
      DO $$
      BEGIN
          -- Adicionar coluna evasao_data
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'instituicoes' 
              AND table_schema = 'public' 
              AND column_name = 'evasao_data'
          ) THEN
              ALTER TABLE public.instituicoes ADD COLUMN evasao_data date;
              RAISE NOTICE 'Coluna evasao_data adicionada com sucesso';
          ELSE
              RAISE NOTICE 'Coluna evasao_data já existe';
          END IF;

          -- Adicionar coluna evasao_motivo
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'instituicoes' 
              AND table_schema = 'public' 
              AND column_name = 'evasao_motivo'
          ) THEN
              ALTER TABLE public.instituicoes ADD COLUMN evasao_motivo text;
              RAISE NOTICE 'Coluna evasao_motivo adicionada com sucesso';
          ELSE
              RAISE NOTICE 'Coluna evasao_motivo já existe';
          END IF;

          -- Adicionar coluna evasao_registrado_em
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'instituicoes' 
              AND table_schema = 'public' 
              AND column_name = 'evasao_registrado_em'
          ) THEN
              ALTER TABLE public.instituicoes ADD COLUMN evasao_registrado_em timestamptz;
              RAISE NOTICE 'Coluna evasao_registrado_em adicionada com sucesso';
          ELSE
              RAISE NOTICE 'Coluna evasao_registrado_em já existe';
          END IF;
      END $$;
    `;

    const { data: addResult, error: addError } = await supabaseAdmin.rpc('exec_sql', {
      sql: addColumnsQuery
    });

    if (addError) {
      console.log('❌ Erro ao adicionar colunas:', addError.message);
      return;
    } else {
      console.log('✅ Comando de adição executado com sucesso');
    }

    // 3. Verificar colunas após adição
    console.log('\n3️⃣ Verificando colunas após adição...');
    const { data: newColumns, error: verifyError } = await supabaseAdmin.rpc('exec_sql', {
      sql: checkColumnsQuery
    });

    if (verifyError) {
      console.log('❌ Erro ao verificar colunas após adição:', verifyError.message);
    } else {
      console.log('📊 Colunas após adição:', newColumns);
      
      if (newColumns && newColumns.length === 3) {
        console.log('\n✅ Todas as 3 colunas de evasão foram adicionadas com sucesso!');
      } else {
        console.log(`\n⚠️ Esperado 3 colunas, encontrado ${newColumns ? newColumns.length : 0}`);
      }
    }

    // 4. Testar a estrutura da tabela
    console.log('\n4️⃣ Testando estrutura da tabela atualizada...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('instituicoes')
      .select('id, nome, evasao_data, evasao_motivo, evasao_registrado_em')
      .limit(1);

    if (testError) {
      console.log('❌ Erro ao testar estrutura:', testError.message);
    } else {
      console.log('✅ Estrutura da tabela testada com sucesso!');
      if (testData && testData.length > 0) {
        console.log('📋 Exemplo de registro:', testData[0]);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

addEvasaoColumns().catch(console.error);