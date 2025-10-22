const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔄 Aplicando migração para múltiplos programas...');
console.log('URL:', supabaseUrl ? 'Definida' : 'Não definida');
console.log('Service Key:', supabaseServiceKey ? 'Definida' : 'Não definida');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('\n1. Verificando estrutura atual...');
    
    // Verificar se a coluna programas já existe
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'instituicoes')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }

    console.log('Colunas atuais:', columns.map(c => `${c.column_name} (${c.data_type})`));

    const hasPrograma = columns.some(c => c.column_name === 'programa');
    const hasProgramas = columns.some(c => c.column_name === 'programas');

    if (hasProgramas) {
      console.log('✅ Coluna programas já existe! Migração já foi aplicada.');
      return;
    }

    if (!hasPrograma) {
      console.log('❌ Coluna programa não encontrada!');
      return;
    }

    console.log('\n2. Aplicando migração SQL...');

    // Executar a migração passo a passo
    const migrationSteps = [
      {
        name: 'Adicionar coluna programas',
        sql: 'ALTER TABLE public.instituicoes ADD COLUMN IF NOT EXISTS programas text[];'
      },
      {
        name: 'Migrar dados existentes',
        sql: `UPDATE public.instituicoes 
              SET programas = ARRAY[programa::text] 
              WHERE programas IS NULL AND programa IS NOT NULL;`
      },
      {
        name: 'Criar índice GIN',
        sql: 'CREATE INDEX IF NOT EXISTS idx_instituicoes_programas_gin ON public.instituicoes USING gin(programas);'
      },
      {
        name: 'Adicionar constraint de validação',
        sql: `ALTER TABLE public.instituicoes 
              ADD CONSTRAINT IF NOT EXISTS check_programas_valid 
              CHECK (programas <@ ARRAY['decolagem', 'as_maras', 'microcredito']::text[]);`
      }
    ];

    for (const step of migrationSteps) {
      console.log(`   Executando: ${step.name}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: step.sql });
      
      if (error) {
        console.error(`   ❌ Erro em "${step.name}":`, error);
        return;
      }
      console.log(`   ✅ ${step.name} - OK`);
    }

    console.log('\n3. Verificando resultado...');
    
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
      console.log(`   ID: ${row.id}, Nome: ${row.nome}`);
      console.log(`   Programa (antigo): ${row.programa}`);
      console.log(`   Programas (novo): ${JSON.stringify(row.programas)}`);
      console.log('   ---');
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
    console.log('\n📝 Próximos passos:');
    console.log('   1. Atualizar tipos TypeScript');
    console.log('   2. Modificar formulário de cadastro');
    console.log('   3. Atualizar dashboards');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

applyMigration();