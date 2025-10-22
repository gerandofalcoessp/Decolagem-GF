const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔄 Verificando e aplicando migração para múltiplos programas...');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndMigrate() {
  try {
    console.log('\n1. Verificando se a coluna programas já existe...');
    
    // Tentar fazer uma consulta na coluna programas para ver se ela existe
    const { data: testData, error: testError } = await supabase
      .from('instituicoes')
      .select('programas')
      .limit(1);

    if (!testError) {
      console.log('✅ Coluna programas já existe!');
      
      // Mostrar dados atuais
      const { data: sampleData } = await supabase
        .from('instituicoes')
        .select('id, nome, programa, programas')
        .limit(5);
      
      console.log('\nAmostra de dados atuais:');
      sampleData?.forEach(row => {
        console.log(`   ${row.nome}:`);
        console.log(`     Programa (antigo): ${row.programa}`);
        console.log(`     Programas (novo): ${JSON.stringify(row.programas)}`);
      });

      // Verificar estatísticas
      const { count: totalCount } = await supabase
        .from('instituicoes')
        .select('*', { count: 'exact', head: true });

      const { count: migratedCount } = await supabase
        .from('instituicoes')
        .select('*', { count: 'exact', head: true })
        .not('programas', 'is', null);

      console.log(`\n📊 Estatísticas:`);
      console.log(`   Total de instituições: ${totalCount}`);
      console.log(`   Com programas migrados: ${migratedCount}`);
      
      if (migratedCount === 0) {
        console.log('\n⚠️ A coluna existe mas não há dados migrados. Vamos migrar os dados...');
        await migrateExistingData();
      } else {
        console.log('\n✅ Migração já foi aplicada com sucesso!');
      }
      
      return;
    }

    console.log('❌ Coluna programas não existe. Precisamos aplicar a migração manualmente.');
    console.log('\n📝 Para aplicar a migração, execute os seguintes comandos SQL no Supabase SQL Editor:');
    console.log('\n-- 1. Adicionar coluna programas');
    console.log('ALTER TABLE public.instituicoes ADD COLUMN programas text[];');
    console.log('\n-- 2. Migrar dados existentes');
    console.log(`UPDATE public.instituicoes 
SET programas = ARRAY[programa::text] 
WHERE programas IS NULL AND programa IS NOT NULL;`);
    console.log('\n-- 3. Criar índice GIN');
    console.log('CREATE INDEX idx_instituicoes_programas_gin ON public.instituicoes USING gin(programas);');
    console.log('\n-- 4. Adicionar constraint de validação');
    console.log(`ALTER TABLE public.instituicoes 
ADD CONSTRAINT check_programas_valid 
CHECK (programas <@ ARRAY['decolagem', 'as_maras', 'microcredito']::text[]);`);
    
    console.log('\n🔗 Acesse: https://supabase.com/dashboard/project/ldfldwfvspclsnpgjgmv/sql');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

async function migrateExistingData() {
  try {
    console.log('\n2. Migrando dados existentes...');
    
    // Buscar todas as instituições que não têm programas migrados
    const { data: instituicoes, error: fetchError } = await supabase
      .from('instituicoes')
      .select('id, programa')
      .is('programas', null)
      .not('programa', 'is', null);

    if (fetchError) {
      console.error('❌ Erro ao buscar instituições:', fetchError);
      return;
    }

    console.log(`   Encontradas ${instituicoes.length} instituições para migrar...`);

    // Migrar cada instituição individualmente
    let migratedCount = 0;
    for (const instituicao of instituicoes) {
      const { error: updateError } = await supabase
        .from('instituicoes')
        .update({ programas: [instituicao.programa] })
        .eq('id', instituicao.id);

      if (updateError) {
        console.error(`   ❌ Erro ao migrar instituição ${instituicao.id}:`, updateError);
      } else {
        migratedCount++;
      }
    }

    console.log(`   ✅ ${migratedCount} instituições migradas com sucesso!`);

  } catch (error) {
    console.error('❌ Erro durante a migração de dados:', error);
  }
}

checkAndMigrate();