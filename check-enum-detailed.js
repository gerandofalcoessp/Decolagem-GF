const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEnumDetailed() {
  try {
    console.log('🔍 Verificação detalhada de enums e estrutura...\n');

    // 1. Verificar TODOS os enums existentes
    const { data: allEnumsData, error: allEnumsError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT 
            t.typname as enum_name,
            array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
          FROM pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid  
          GROUP BY t.typname
          ORDER BY t.typname;
        `
      });

    if (allEnumsError) {
      console.error('❌ Erro ao verificar todos os enums:', allEnumsError);
    } else {
      console.log('📋 TODOS os enums encontrados:');
      if (allEnumsData && allEnumsData.length > 0) {
        allEnumsData.forEach(enumInfo => {
          console.log(`  🔸 ${enumInfo.enum_name}: [${enumInfo.enum_values.join(', ')}]`);
        });
      } else {
        console.log('  ❌ Nenhum enum encontrado');
      }
    }

    // 2. Verificar estrutura completa da tabela instituicoes
    const { data: tableStructure, error: structureError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            udt_name,
            column_default,
            is_nullable,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = 'instituicoes'
          ORDER BY ordinal_position;
        `
      });

    if (structureError) {
      console.error('❌ Erro ao verificar estrutura da tabela:', structureError);
    } else {
      console.log('\n📊 Estrutura completa da tabela instituicoes:');
      if (tableStructure && tableStructure.length > 0) {
        tableStructure.forEach(col => {
          console.log(`  🔸 ${col.column_name}:`);
          console.log(`     Tipo: ${col.data_type}`);
          console.log(`     UDT: ${col.udt_name}`);
          console.log(`     Default: ${col.column_default || 'NULL'}`);
          console.log(`     Nullable: ${col.is_nullable}`);
          if (col.character_maximum_length) {
            console.log(`     Max Length: ${col.character_maximum_length}`);
          }
          console.log('');
        });
      } else {
        console.log('  ❌ Estrutura não encontrada');
      }
    }

    // 3. Verificar especificamente o enum usado pela coluna status
    const { data: statusEnumData, error: statusEnumError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT 
            c.column_name,
            c.udt_name,
            array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
          FROM information_schema.columns c
          LEFT JOIN pg_type t ON t.typname = c.udt_name
          LEFT JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE c.table_schema = 'public' 
            AND c.table_name = 'instituicoes'
            AND c.column_name = 'status'
          GROUP BY c.column_name, c.udt_name;
        `
      });

    if (statusEnumError) {
      console.error('❌ Erro ao verificar enum da coluna status:', statusEnumError);
    } else {
      console.log('🎯 Enum específico da coluna status:');
      if (statusEnumData && statusEnumData.length > 0) {
        const statusInfo = statusEnumData[0];
        console.log(`  🔸 Coluna: ${statusInfo.column_name}`);
        console.log(`  🔸 Enum Type: ${statusInfo.udt_name}`);
        console.log(`  🔸 Valores válidos: [${statusInfo.enum_values ? statusInfo.enum_values.join(', ') : 'N/A'}]`);
      } else {
        console.log('  ❌ Informações do enum não encontradas');
      }
    }

    // 4. Verificar dados atuais na tabela
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from('instituicoes')
      .select('id, nome, status')
      .limit(3);

    if (sampleError) {
      console.error('❌ Erro ao buscar dados de exemplo:', sampleError);
    } else {
      console.log('\n📋 Dados de exemplo na tabela:');
      if (sampleData && sampleData.length > 0) {
        sampleData.forEach(inst => {
          console.log(`  🔸 ${inst.nome}: status = "${inst.status}"`);
        });
      } else {
        console.log('  ❌ Nenhum dado encontrado');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkEnumDetailed().catch(console.error);