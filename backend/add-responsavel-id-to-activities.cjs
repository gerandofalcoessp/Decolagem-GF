const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addResponsavelIdToActivities() {
  try {
    console.log('🔧 Adicionando campo responsavel_id à tabela activities...');
    
    // SQL para adicionar a coluna responsavel_id com referência à tabela usuarios
    const addColumnSQL = `
      DO $$
      BEGIN
        -- Verificar se a coluna já existe
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'activities' 
          AND column_name = 'responsavel_id' 
          AND table_schema = 'public'
        ) THEN
          -- Adicionar a coluna responsavel_id
          ALTER TABLE public.activities 
          ADD COLUMN responsavel_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL;
          
          RAISE NOTICE 'Coluna responsavel_id adicionada à tabela activities';
        ELSE
          RAISE NOTICE 'Coluna responsavel_id já existe na tabela activities';
        END IF;
      END $$;
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: addColumnSQL });
    
    if (error) {
      console.error('❌ Erro ao adicionar coluna:', error);
      return;
    }
    
    console.log('✅ Campo responsavel_id adicionado com sucesso!');
    
    // Verificar se a coluna foi criada
    console.log('\n🔍 Verificando se a coluna foi criada...');
    
    const verifySQL = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'activities' 
      AND table_schema = 'public'
      AND column_name = 'responsavel_id';
    `;
    
    const { data: columnInfo, error: verifyError } = await supabase.rpc('exec_sql', { sql: verifySQL });
    
    if (verifyError) {
      console.error('❌ Erro ao verificar coluna:', verifyError);
    } else if (columnInfo && columnInfo.length > 0) {
      console.log('✅ Coluna responsavel_id confirmada:');
      console.log(`   - Tipo: ${columnInfo[0].data_type}`);
      console.log(`   - Nullable: ${columnInfo[0].is_nullable}`);
    } else {
      console.log('⚠️ Coluna não encontrada na verificação');
    }
    
    // Criar índice para melhor performance
    console.log('\n📊 Criando índice para responsavel_id...');
    
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_activities_responsavel_id 
      ON public.activities(responsavel_id);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexSQL });
    
    if (indexError) {
      console.error('❌ Erro ao criar índice:', indexError);
    } else {
      console.log('✅ Índice criado com sucesso!');
    }
    
    console.log('\n🎉 Modificação da tabela activities concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
addResponsavelIdToActivities().catch(console.error);