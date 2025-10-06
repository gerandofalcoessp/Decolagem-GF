const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMissingColumns() {
  console.log('🔧 Adicionando colunas faltantes...\n');

  try {
    // 1. Adicionar coluna description à tabela goals
    console.log('1. Adicionando coluna description à tabela goals...');
    const { data: goalsResult, error: goalsError } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE public.goals 
        ADD COLUMN IF NOT EXISTS description text;
        
        COMMENT ON COLUMN public.goals.description IS 'Descrição detalhada da meta';
      `
    });

    if (goalsError) {
      console.error('❌ Erro ao adicionar coluna description:', goalsError);
    } else {
      console.log('✅ Coluna description adicionada à tabela goals');
    }

    // 2. Adicionar coluna titulo à tabela activities
    console.log('\n2. Adicionando coluna titulo à tabela activities...');
    const { data: activitiesResult, error: activitiesError } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE public.activities 
        ADD COLUMN IF NOT EXISTS titulo varchar(255);
        
        COMMENT ON COLUMN public.activities.titulo IS 'Título da atividade';
      `
    });

    if (activitiesError) {
      console.error('❌ Erro ao adicionar coluna titulo:', activitiesError);
    } else {
      console.log('✅ Coluna titulo adicionada à tabela activities');
    }

    // 3. Verificar se as colunas foram criadas
    console.log('\n3. Verificando colunas criadas...');
    
    // Verificar goals
    const { data: goalsColumns, error: goalsColumnsError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'goals' 
        AND table_schema = 'public'
        AND column_name IN ('description', 'current_value', 'target_value')
        ORDER BY column_name;
      `
    });

    if (goalsColumnsError) {
      console.error('❌ Erro ao verificar colunas da tabela goals:', goalsColumnsError);
    } else {
      console.log('📊 Colunas da tabela goals:');
      if (goalsColumns && goalsColumns.length > 0) {
        goalsColumns.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      } else {
        console.log('   Nenhuma coluna encontrada');
      }
    }

    // Verificar activities
    const { data: activitiesColumns, error: activitiesColumnsError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND table_schema = 'public'
        AND column_name IN ('titulo', 'type', 'title')
        ORDER BY column_name;
      `
    });

    if (activitiesColumnsError) {
      console.error('❌ Erro ao verificar colunas da tabela activities:', activitiesColumnsError);
    } else {
      console.log('\n📊 Colunas da tabela activities:');
      if (activitiesColumns && activitiesColumns.length > 0) {
        activitiesColumns.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      } else {
        console.log('   Nenhuma coluna encontrada');
      }
    }

    console.log('\n✅ Processo de adição de colunas concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

addMissingColumns().catch(console.error);