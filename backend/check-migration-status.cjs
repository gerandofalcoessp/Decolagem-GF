const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMigrationStatus() {
  try {
    console.log('🔍 Verificando status da migração da coluna documentos...\n');
    
    // 1. Verificar se existe uma tabela de migrações
    console.log('📋 Verificando se existe controle de migrações...');
    const { data: migrationTables, error: migrationError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%migration%'
        ORDER BY table_name;
      `
    });
    
    if (migrationError) {
      console.error('❌ Erro ao verificar tabelas de migração:', migrationError);
    } else {
      console.log('✅ Tabelas de migração encontradas:', migrationTables);
    }
    
    // 2. Verificar se a coluna documentos existe na tabela atual
    console.log('\n🔍 Verificando se a coluna documentos existe...');
    const { data: columnCheck, error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'instituicoes'
        AND column_name = 'documentos';
      `
    });
    
    if (columnError) {
      console.error('❌ Erro ao verificar coluna documentos:', columnError);
    } else {
      console.log('✅ Resultado da verificação da coluna documentos:', columnCheck);
      
      if (columnCheck && columnCheck.success && columnCheck.rows_affected === 0) {
        console.log('❌ A coluna documentos NÃO existe na tabela');
      } else if (columnCheck && columnCheck.success && columnCheck.rows_affected > 0) {
        console.log('✅ A coluna documentos existe na tabela');
      }
    }
    
    // 3. Verificar se a coluna updated_at existe (também definida na migração)
    console.log('\n🔍 Verificando se a coluna updated_at existe...');
    const { data: updatedAtCheck, error: updatedAtError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'instituicoes'
        AND column_name = 'updated_at';
      `
    });
    
    if (updatedAtError) {
      console.error('❌ Erro ao verificar coluna updated_at:', updatedAtError);
    } else {
      console.log('✅ Resultado da verificação da coluna updated_at:', updatedAtCheck);
    }
    
    // 4. Verificar se os enums existem
    console.log('\n🔍 Verificando se os enums da migração existem...');
    const { data: enumCheck, error: enumError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT typname 
        FROM pg_type 
        WHERE typname IN ('instituicao_status', 'programa_type', 'regional_type')
        ORDER BY typname;
      `
    });
    
    if (enumError) {
      console.error('❌ Erro ao verificar enums:', enumError);
    } else {
      console.log('✅ Enums encontrados:', enumCheck);
    }
    
    // 5. Mostrar estrutura atual completa da tabela
    console.log('\n📊 Estrutura atual completa da tabela instituicoes:');
    const { data: fullStructure, error: structureError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'instituicoes'
        ORDER BY ordinal_position;
      `
    });
    
    if (structureError) {
      console.error('❌ Erro ao obter estrutura completa:', structureError);
    } else {
      console.log('✅ Estrutura completa obtida:', fullStructure);
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

checkMigrationStatus();