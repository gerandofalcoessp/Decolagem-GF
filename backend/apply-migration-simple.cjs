const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔄 Aplicando migração para múltiplos programas...');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function execSQL(sql, description) {
  console.log(`   Executando: ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.error(`   ❌ Erro em "${description}":`, error);
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
    console.log('\n1. Verificando se a migração já foi aplicada...');
    
    // Verificar se a coluna programas já existe
    const checkColumnSQL = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'instituicoes' 
        AND table_schema = 'public' 
        AND column_name = 'programas';
    `;
    
    const { data: columnCheck, error: columnError } = await supabase.rpc('exec_sql', { sql_query: checkColumnSQL });
    
    if (columnError) {
      console.error('❌ Erro ao verificar coluna:', columnError);
      return;
    }

    if (columnCheck && columnCheck.length > 0) {
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

    console.log('\n2. Aplicando migração SQL...');

    // Passo 1: Adicionar coluna programas
    const success1 = await execSQL(
      'ALTER TABLE public.instituicoes ADD COLUMN programas text[];',
      'Adicionar coluna programas'
    );
    if (!success1) return;

    // Passo 2: Migrar dados existentes
    const success2 = await execSQL(
      `UPDATE public.instituicoes 
       SET programas = ARRAY[programa::text] 
       WHERE programas IS NULL AND programa IS NOT NULL;`,
      'Migrar dados existentes'
    );
    if (!success2) return;

    // Passo 3: Criar índice GIN
    const success3 = await execSQL(
      'CREATE INDEX idx_instituicoes_programas_gin ON public.instituicoes USING gin(programas);',
      'Criar índice GIN'
    );
    if (!success3) return;

    // Passo 4: Adicionar constraint de validação
    const success4 = await execSQL(
      `ALTER TABLE public.instituicoes 
       ADD CONSTRAINT check_programas_valid 
       CHECK (programas <@ ARRAY['decolagem', 'as_maras', 'microcredito']::text[]);`,
      'Adicionar constraint de validação'
    );
    if (!success4) return;

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