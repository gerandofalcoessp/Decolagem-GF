const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixStatusEnum() {
  try {
    console.log('🔧 Corrigindo enum de status...\n');

    // 1. Primeiro, vamos verificar qual enum está sendo usado
    const { data: currentEnumData, error: currentEnumError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT 
            c.udt_name,
            array_agg(e.enumlabel ORDER BY e.enumsortorder) as current_values
          FROM information_schema.columns c
          LEFT JOIN pg_type t ON t.typname = c.udt_name
          LEFT JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE c.table_schema = 'public' 
            AND c.table_name = 'instituicoes'
            AND c.column_name = 'status'
          GROUP BY c.udt_name;
        `
      });

    if (currentEnumError) {
      console.error('❌ Erro ao verificar enum atual:', currentEnumError);
      return;
    }

    if (!currentEnumData || currentEnumData.length === 0) {
      console.log('❌ Não foi possível identificar o enum atual');
      return;
    }

    const enumInfo = currentEnumData[0];
    console.log(`📋 Enum atual: ${enumInfo.udt_name}`);
    console.log(`📋 Valores atuais: [${enumInfo.current_values ? enumInfo.current_values.join(', ') : 'N/A'}]`);

    // 2. Verificar se 'evadida' já existe
    const hasEvadida = enumInfo.current_values && enumInfo.current_values.includes('evadida');
    
    if (hasEvadida) {
      console.log('✅ O valor "evadida" já existe no enum!');
      return;
    }

    console.log('⚠️ O valor "evadida" não existe no enum. Adicionando...');

    // 3. Adicionar o valor 'evadida' ao enum
    const { data: addEnumData, error: addEnumError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `ALTER TYPE ${enumInfo.udt_name} ADD VALUE 'evadida';`
      });

    if (addEnumError) {
      console.error('❌ Erro ao adicionar valor ao enum:', addEnumError);
      
      // Se falhar, vamos tentar recriar o enum completamente
      console.log('🔄 Tentando recriar o enum completamente...');
      
      const { data: recreateData, error: recreateError } = await supabaseAdmin
        .rpc('exec_sql', {
          sql: `
            -- Primeiro, alterar a coluna para text temporariamente
            ALTER TABLE instituicoes ALTER COLUMN status TYPE text;
            
            -- Dropar o enum antigo
            DROP TYPE IF EXISTS ${enumInfo.udt_name} CASCADE;
            
            -- Recriar o enum com todos os valores
            CREATE TYPE ${enumInfo.udt_name} AS ENUM ('ativa', 'inativa', 'evadida');
            
            -- Restaurar a coluna para usar o enum
            ALTER TABLE instituicoes ALTER COLUMN status TYPE ${enumInfo.udt_name} USING status::${enumInfo.udt_name};
            
            -- Definir default
            ALTER TABLE instituicoes ALTER COLUMN status SET DEFAULT 'ativa';
          `
      });

      if (recreateError) {
        console.error('❌ Erro ao recriar enum:', recreateError);
        return;
      } else {
        console.log('✅ Enum recriado com sucesso!');
      }
    } else {
      console.log('✅ Valor "evadida" adicionado ao enum com sucesso!');
    }

    // 4. Verificar o resultado final
    const { data: finalEnumData, error: finalEnumError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT 
            c.udt_name,
            array_agg(e.enumlabel ORDER BY e.enumsortorder) as final_values
          FROM information_schema.columns c
          LEFT JOIN pg_type t ON t.typname = c.udt_name
          LEFT JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE c.table_schema = 'public' 
            AND c.table_name = 'instituicoes'
            AND c.column_name = 'status'
          GROUP BY c.udt_name;
        `
      });

    if (finalEnumError) {
      console.error('❌ Erro ao verificar resultado final:', finalEnumError);
    } else {
      console.log('\n🎯 Resultado final:');
      if (finalEnumData && finalEnumData.length > 0) {
        const finalInfo = finalEnumData[0];
        console.log(`  🔸 Enum: ${finalInfo.udt_name}`);
        console.log(`  🔸 Valores: [${finalInfo.final_values ? finalInfo.final_values.join(', ') : 'N/A'}]`);
      }
    }

    // 5. Testar o valor 'evadida'
    console.log('\n🧪 Testando o valor "evadida"...');
    
    const { data: testData, error: testError } = await supabaseAdmin
      .from('instituicoes')
      .select('id, nome, status')
      .limit(1);

    if (testError || !testData || testData.length === 0) {
      console.log('❌ Não foi possível encontrar instituição para teste');
      return;
    }

    const instituicao = testData[0];
    const originalStatus = instituicao.status;
    
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('instituicoes')
      .update({ status: 'evadida' })
      .eq('id', instituicao.id)
      .select('status');

    if (updateError) {
      console.log(`❌ Erro no teste: ${updateError.message}`);
    } else {
      console.log(`✅ Teste bem-sucedido! Status atualizado para: ${updateData[0].status}`);
      
      // Restaurar status original
      await supabaseAdmin
        .from('instituicoes')
        .update({ status: originalStatus })
        .eq('id', instituicao.id);
      
      console.log(`🔄 Status restaurado para: ${originalStatus}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixStatusEnum().catch(console.error);