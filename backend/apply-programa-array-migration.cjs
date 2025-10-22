const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://ixqkqvfvwvnxkqvfvwvn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWtxdmZ2d3ZueGtxdmZ2d3ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzU1NzI4NCwiZXhwIjoyMDUzMTMzMjg0fQ.Kj8nKWJZQBGgmJQGgmJQGgmJQGgmJQGgmJQGgmJQGgmJQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyProgramaArrayMigration() {
  console.log('🔄 Aplicando migração para múltiplos programas...\n');

  try {
    // 1. Verificar estrutura atual da tabela
    console.log('1. Verificando estrutura atual da tabela instituicoes...');
    const { data: currentColumns, error: columnsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'instituicoes' 
          AND table_schema = 'public'
          AND column_name IN ('programa', 'programas')
          ORDER BY column_name;
        `
      });

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }

    console.log('Colunas encontradas:', currentColumns);

    // 2. Verificar dados atuais
    console.log('\n2. Verificando dados atuais...');
    const { data: currentData, error: dataError } = await supabase
      .from('instituicoes')
      .select('id, nome, programa')
      .limit(5);

    if (dataError) {
      console.error('❌ Erro ao buscar dados atuais:', dataError);
      return;
    }

    console.log('Exemplos de dados atuais:');
    currentData.forEach(item => {
      console.log(`  - ${item.nome}: programa = ${item.programa}`);
    });

    // 3. Aplicar migração
    console.log('\n3. Aplicando migração...');
    
    const migrationSQL = `
      BEGIN;

      -- Adicionar nova coluna programas como array se não existir
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'instituicoes' 
              AND table_schema = 'public' 
              AND column_name = 'programas'
          ) THEN
              ALTER TABLE public.instituicoes 
              ADD COLUMN programas text[] DEFAULT ARRAY[]::text[];
              RAISE NOTICE 'Coluna programas adicionada';
          ELSE
              RAISE NOTICE 'Coluna programas já existe';
          END IF;
      END $$;

      -- Migrar dados existentes - converter programa único para array
      UPDATE public.instituicoes 
      SET programas = ARRAY[programa::text]
      WHERE programa IS NOT NULL AND (programas IS NULL OR array_length(programas, 1) IS NULL);

      -- Para registros sem programa, definir array vazio
      UPDATE public.instituicoes 
      SET programas = ARRAY[]::text[]
      WHERE programa IS NULL AND (programas IS NULL OR array_length(programas, 1) IS NULL);

      -- Criar índice para o novo campo se não existir
      CREATE INDEX IF NOT EXISTS idx_instituicoes_programas ON public.instituicoes USING GIN(programas);

      -- Adicionar constraint para validar valores permitidos
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'check_programas_validos' 
              AND table_name = 'instituicoes'
          ) THEN
              ALTER TABLE public.instituicoes 
              ADD CONSTRAINT check_programas_validos 
              CHECK (
                  programas <@ ARRAY['decolagem', 'as_maras', 'microcredito']::text[]
                  AND array_length(programas, 1) > 0
              );
              RAISE NOTICE 'Constraint check_programas_validos adicionada';
          ELSE
              RAISE NOTICE 'Constraint check_programas_validos já existe';
          END IF;
      END $$;

      COMMIT;
    `;

    const { data: migrationResult, error: migrationError } = await supabase
      .rpc('exec_sql', { sql: migrationSQL });

    if (migrationError) {
      console.error('❌ Erro na migração:', migrationError);
      return;
    }

    console.log('✅ Migração aplicada com sucesso!');

    // 4. Verificar resultado da migração
    console.log('\n4. Verificando resultado da migração...');
    const { data: migratedData, error: verifyError } = await supabase
      .from('instituicoes')
      .select('id, nome, programa, programas')
      .limit(5);

    if (verifyError) {
      console.error('❌ Erro ao verificar migração:', verifyError);
      return;
    }

    console.log('Exemplos de dados migrados:');
    migratedData.forEach(item => {
      console.log(`  - ${item.nome}:`);
      console.log(`    programa (antigo): ${item.programa}`);
      console.log(`    programas (novo): [${item.programas?.join(', ')}]`);
    });

    // 5. Contar registros migrados
    console.log('\n5. Estatísticas da migração...');
    const { data: stats, error: statsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            COUNT(*) as total_registros,
            COUNT(CASE WHEN programas IS NOT NULL AND array_length(programas, 1) > 0 THEN 1 END) as com_programas,
            COUNT(CASE WHEN programas = ARRAY[]::text[] THEN 1 END) as sem_programas
          FROM public.instituicoes;
        `
      });

    if (statsError) {
      console.error('❌ Erro ao obter estatísticas:', statsError);
      return;
    }

    console.log('Estatísticas da migração:');
    if (stats && stats.length > 0) {
      const stat = stats[0];
      console.log(`  - Total de registros: ${stat.total_registros}`);
      console.log(`  - Com programas: ${stat.com_programas}`);
      console.log(`  - Sem programas: ${stat.sem_programas}`);
    }

    console.log('\n✅ Migração concluída com sucesso!');
    console.log('📝 Próximos passos:');
    console.log('  1. Atualizar tipos TypeScript');
    console.log('  2. Modificar frontend para seleção múltipla');
    console.log('  3. Atualizar backend para processar arrays');
    console.log('  4. Atualizar dashboards');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar migração
applyProgramaArrayMigration();