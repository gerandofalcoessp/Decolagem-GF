const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔄 Aplicando migração para múltiplos programas...');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createExecFunction() {
  console.log('\n1. Criando função exec_sql...');
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
      RETURN 'OK';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN 'ERROR: ' || SQLERRM;
    END;
    $$;
  `;

  try {
    const { error } = await supabase.rpc('exec', { sql: createFunctionSQL });
    if (error) {
      console.error('❌ Erro ao criar função:', error);
      return false;
    }
    console.log('✅ Função exec_sql criada com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ Erro ao criar função:', err);
    return false;
  }
}

async function execSQL(sql, description) {
  console.log(`   Executando: ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error(`   ❌ Erro em "${description}":`, error);
      return false;
    }
    if (data && data.startsWith('ERROR:')) {
      console.error(`   ❌ Erro SQL em "${description}":`, data);
      return false;
    }
    console.log(`   ✅ ${description} - OK`);
    return true;
  } catch (err) {
    console.error(`   ❌ Erro em "${description}":`, err);
    return false;
  }
}

async function applyMigration() {
  try {
    // Primeiro, tentar criar a função exec_sql
    const functionCreated = await createExecFunction();
    if (!functionCreated) {
      console.log('⚠️ Tentando continuar sem a função...');
    }

    console.log('\n2. Verificando se a migração já foi aplicada...');
    
    // Verificar se a coluna programas já existe usando uma consulta direta
    const { data: existingData, error: existingError } = await supabase
      .from('instituicoes')
      .select('programas')
      .limit(1);

    if (!existingError && existingData) {
      console.log('✅ Coluna programas já existe! Migração já foi aplicada.');
      
      // Mostrar dados atuais
      const { data: sampleData } = await supabase
        .from('instituicoes')
        .select('id, nome, programa, programas')
        .limit(3);
      
      console.log('\nAmostra de dados atuais:');
      sampleData?.forEach(row => {
        console.log(`   ${row.nome}: programa=${row.programa}, programas=${JSON.stringify(row.programas)}`);
      });
      
      return;
    }

    console.log('\n3. Aplicando migração SQL...');

    // Aplicar migração usando SQL direto
    const migrationSQL = `
      -- Passo 1: Adicionar coluna programas
      ALTER TABLE public.instituicoes ADD COLUMN IF NOT EXISTS programas text[];
      
      -- Passo 2: Migrar dados existentes
      UPDATE public.instituicoes 
      SET programas = ARRAY[programa::text] 
      WHERE programas IS NULL AND programa IS NOT NULL;
      
      -- Passo 3: Criar índice GIN
      CREATE INDEX IF NOT EXISTS idx_instituicoes_programas_gin 
      ON public.instituicoes USING gin(programas);
      
      -- Passo 4: Adicionar constraint de validação
      ALTER TABLE public.instituicoes 
      ADD CONSTRAINT IF NOT EXISTS check_programas_valid 
      CHECK (programas <@ ARRAY['decolagem', 'as_maras', 'microcredito']::text[]);
    `;

    const success = await execSQL(migrationSQL, 'Migração completa');
    if (!success) {
      console.error('❌ Falha na migração');
      return;
    }

    console.log('\n4. Verificando resultado...');
    
    // Verificar dados migrados
    const { data: sampleData, error: sampleError } = await supabase
      .from('instituicoes')
      .select('id, nome, programa, programas')
      .limit(5);

    if (sampleError) {
      console.error('❌ Erro ao verificar dados:', sampleError);
      return;
    }

    console.log('Amostra de dados migrados:');
    sampleData.forEach(row => {
      console.log(`   ${row.nome}:`);
      console.log(`     Programa (antigo): ${row.programa}`);
      console.log(`     Programas (novo): ${JSON.stringify(row.programas)}`);
    });

    // Estatísticas
    const { count: totalCount } = await supabase
      .from('instituicoes')
      .select('*', { count: 'exact', head: true });

    const { count: migratedCount } = await supabase
      .from('instituicoes')
      .select('*', { count: 'exact', head: true })
      .not('programas', 'is', null);

    console.log(`\n📊 Estatísticas:`);
    console.log(`   Total de instituições: ${totalCount}`);
    console.log(`   Migradas com sucesso: ${migratedCount}`);
    console.log(`   Taxa de sucesso: ${((migratedCount / totalCount) * 100).toFixed(1)}%`);

    console.log('\n✅ Migração aplicada com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

applyMigration();