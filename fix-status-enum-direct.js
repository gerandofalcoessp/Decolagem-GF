const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixStatusEnumDirect() {
  try {
    console.log('🔧 Corrigindo enum de status - Abordagem Direta...\n');

    // 1. Primeiro, vamos verificar o tipo atual da coluna status
    console.log('🔍 Verificando tipo atual da coluna status...');
    
    const { data: columnInfo, error: columnError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            udt_name,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = 'instituicoes' 
            AND column_name = 'status';
        `
      });

    if (columnError) {
      console.error('❌ Erro ao verificar coluna:', columnError);
      return;
    }

    console.log('📋 Informações da coluna status:');
    if (columnInfo && columnInfo.length > 0) {
      const col = columnInfo[0];
      console.log(`  🔸 Tipo: ${col.data_type}`);
      console.log(`  🔸 UDT: ${col.udt_name}`);
      console.log(`  🔸 Default: ${col.column_default}`);
    }

    // 2. Vamos tentar uma abordagem mais direta - alterar a coluna para text e depois recriar o enum
    console.log('\n🔄 Alterando coluna para text temporariamente...');
    
    const { data: alterToText, error: alterToTextError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          -- Alterar coluna para text
          ALTER TABLE instituicoes ALTER COLUMN status TYPE text;
        `
      });

    if (alterToTextError) {
      console.error('❌ Erro ao alterar para text:', alterToTextError);
      return;
    }
    console.log('✅ Coluna alterada para text');

    // 3. Dropar enums antigos se existirem
    console.log('\n🗑️ Removendo enums antigos...');
    
    const { data: dropEnums, error: dropEnumsError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          DROP TYPE IF EXISTS status_type CASCADE;
          DROP TYPE IF EXISTS instituicao_status CASCADE;
        `
      });

    if (dropEnumsError) {
      console.error('❌ Erro ao dropar enums:', dropEnumsError);
    } else {
      console.log('✅ Enums antigos removidos');
    }

    // 4. Criar novo enum com todos os valores necessários
    console.log('\n🆕 Criando novo enum status_type...');
    
    const { data: createEnum, error: createEnumError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          CREATE TYPE status_type AS ENUM ('ativa', 'inativa', 'evadida');
        `
      });

    if (createEnumError) {
      console.error('❌ Erro ao criar enum:', createEnumError);
      return;
    }
    console.log('✅ Enum status_type criado com valores: ativa, inativa, evadida');

    // 5. Alterar a coluna de volta para usar o enum
    console.log('\n🔄 Alterando coluna para usar o novo enum...');
    
    const { data: alterToEnum, error: alterToEnumError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          ALTER TABLE instituicoes 
          ALTER COLUMN status TYPE status_type 
          USING status::status_type;
          
          ALTER TABLE instituicoes 
          ALTER COLUMN status SET DEFAULT 'ativa';
        `
      });

    if (alterToEnumError) {
      console.error('❌ Erro ao alterar para enum:', alterToEnumError);
      return;
    }
    console.log('✅ Coluna alterada para usar o novo enum');

    // 6. Verificar o resultado
    console.log('\n🔍 Verificando resultado final...');
    
    const { data: finalCheck, error: finalCheckError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT 
            t.typname as enum_name,
            array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
          FROM pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid  
          WHERE t.typname = 'status_type'
          GROUP BY t.typname;
        `
      });

    if (finalCheckError) {
      console.error('❌ Erro na verificação final:', finalCheckError);
    } else {
      console.log('📋 Enum final:');
      if (finalCheck && finalCheck.length > 0) {
        const enumInfo = finalCheck[0];
        console.log(`  🔸 Nome: ${enumInfo.enum_name}`);
        console.log(`  🔸 Valores: [${enumInfo.enum_values.join(', ')}]`);
      }
    }

    // 7. Testar o valor 'evadida'
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
    
    console.log(`📋 Testando com: ${instituicao.nome} (status atual: ${originalStatus})`);
    
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

    console.log('\n🎉 Correção do enum concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixStatusEnumDirect().catch(console.error);