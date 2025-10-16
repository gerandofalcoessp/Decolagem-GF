const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEnumStatus() {
  try {
    console.log('🔍 Verificando enums de status no banco de dados...\n');

    // 1. Verificar todos os enums existentes
    const { data: enumsData, error: enumsError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT 
            t.typname as enum_name,
            array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
          FROM pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid  
          WHERE t.typname LIKE '%status%'
          GROUP BY t.typname
          ORDER BY t.typname;
        `
      });

    if (enumsError) {
      console.error('❌ Erro ao verificar enums:', enumsError);
      return;
    }

    console.log('📋 Enums de status encontrados:');
    if (enumsData && enumsData.length > 0) {
      enumsData.forEach(enumInfo => {
        console.log(`  🔸 ${enumInfo.enum_name}: [${enumInfo.enum_values.join(', ')}]`);
      });
    } else {
      console.log('  ❌ Nenhum enum de status encontrado');
    }

    // 2. Verificar a estrutura atual da coluna status na tabela instituicoes
    const { data: columnInfo, error: columnError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            udt_name,
            column_default,
            is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = 'instituicoes' 
            AND column_name = 'status';
        `
      });

    if (columnError) {
      console.error('❌ Erro ao verificar coluna status:', columnError);
      return;
    }

    console.log('\n📊 Informações da coluna status:');
    if (columnInfo && columnInfo.length > 0) {
      const col = columnInfo[0];
      console.log(`  🔸 Nome: ${col.column_name}`);
      console.log(`  🔸 Tipo: ${col.data_type}`);
      console.log(`  🔸 UDT Name: ${col.udt_name}`);
      console.log(`  🔸 Default: ${col.column_default}`);
      console.log(`  🔸 Nullable: ${col.is_nullable}`);
    } else {
      console.log('  ❌ Coluna status não encontrada');
    }

    // 3. Testar valores válidos
    console.log('\n🧪 Testando valores válidos para o enum...');
    
    // Buscar uma instituição para teste
    const { data: instituicoes, error: selectError } = await supabaseAdmin
      .from('instituicoes')
      .select('id, nome, status')
      .limit(1);

    if (selectError || !instituicoes || instituicoes.length === 0) {
      console.log('❌ Não foi possível encontrar instituição para teste');
      return;
    }

    const instituicao = instituicoes[0];
    console.log(`📋 Testando com: ${instituicao.nome} (status atual: ${instituicao.status})`);

    // Testar diferentes valores
    const testValues = ['ativa', 'inativa', 'evadida'];
    
    for (const testValue of testValues) {
      console.log(`\n🔄 Testando valor: "${testValue}"`);
      
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('instituicoes')
        .update({ status: testValue })
        .eq('id', instituicao.id)
        .select('status');

      if (updateError) {
        console.log(`  ❌ Erro: ${updateError.message}`);
      } else {
        console.log(`  ✅ Sucesso! Status atualizado para: ${updateData[0].status}`);
      }
    }

    // Restaurar status original
    await supabaseAdmin
      .from('instituicoes')
      .update({ status: instituicao.status })
      .eq('id', instituicao.id);
    
    console.log(`\n🔄 Status restaurado para: ${instituicao.status}`);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkEnumStatus().catch(console.error);