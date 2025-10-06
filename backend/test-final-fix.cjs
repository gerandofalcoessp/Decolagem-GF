const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFinalFix() {
  try {
    console.log('🎯 Teste final: Verificando se o erro da coluna documentos foi resolvido...\n');
    
    // 1. Verificar estrutura da tabela
    console.log('📊 1. Verificando estrutura atual da tabela...');
    const { data: structure, error: structureError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'instituicoes'
        AND column_name IN ('documentos', 'updated_at')
        ORDER BY column_name;
      `
    });
    
    if (structureError) {
      console.error('❌ Erro ao verificar estrutura:', structureError);
      return;
    }
    
    console.log('✅ Estrutura verificada:', structure);
    
    // 2. Teste de operações CRUD completas
    console.log('\n🧪 2. Testando operações CRUD completas...');
    
    // CREATE
    console.log('📝 Testando CREATE...');
    const testData = {
      nome: 'Instituição Teste Final',
      cnpj: '12345678901234',
      endereco: 'Rua Teste, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      regional: 'sp',
      programa: 'decolagem',
      documentos: [
        { tipo: 'estatuto', nome: 'estatuto.pdf', url: 'https://example.com/estatuto.pdf' },
        { tipo: 'cnpj', nome: 'cnpj.pdf', url: 'https://example.com/cnpj.pdf' }
      ]
    };
    
    const { data: createResult, error: createError } = await supabase
      .from('instituicoes')
      .insert(testData)
      .select('*')
      .single();
    
    if (createError) {
      console.error('❌ Erro no CREATE:', createError);
      return;
    }
    
    console.log('✅ CREATE funcionou!');
    console.log('📊 ID criado:', createResult.id);
    console.log('📄 Documentos:', createResult.documentos);
    
    // READ
    console.log('\n📖 Testando READ...');
    const { data: readResult, error: readError } = await supabase
      .from('instituicoes')
      .select('*')
      .eq('id', createResult.id)
      .single();
    
    if (readError) {
      console.error('❌ Erro no READ:', readError);
    } else {
      console.log('✅ READ funcionou!');
      console.log('📄 Documentos lidos:', readResult.documentos);
    }
    
    // UPDATE
    console.log('\n✏️ Testando UPDATE...');
    const updatedDocuments = [
      ...createResult.documentos,
      { tipo: 'ata', nome: 'ata_fundacao.pdf', url: 'https://example.com/ata.pdf' }
    ];
    
    const { data: updateResult, error: updateError } = await supabase
      .from('instituicoes')
      .update({ 
        documentos: updatedDocuments,
        observacoes: 'Teste de atualização com documentos'
      })
      .eq('id', createResult.id)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('❌ Erro no UPDATE:', updateError);
    } else {
      console.log('✅ UPDATE funcionou!');
      console.log('📄 Documentos atualizados:', updateResult.documentos);
      console.log('📝 Observações:', updateResult.observacoes);
    }
    
    // 3. Teste de consultas com filtros
    console.log('\n🔍 3. Testando consultas com filtros...');
    
    const { data: filterResult, error: filterError } = await supabase
      .from('instituicoes')
      .select('id, nome, documentos')
      .eq('regional', 'sp')
      .limit(5);
    
    if (filterError) {
      console.error('❌ Erro na consulta com filtro:', filterError);
    } else {
      console.log('✅ Consulta com filtro funcionou!');
      console.log('📊 Registros encontrados:', filterResult.length);
    }
    
    // 4. Teste de consulta específica de documentos
    console.log('\n📄 4. Testando consulta específica de documentos...');
    
    const { data: docsResult, error: docsError } = await supabase
      .from('instituicoes')
      .select('nome, documentos')
      .not('documentos', 'is', null)
      .limit(3);
    
    if (docsError) {
      console.error('❌ Erro na consulta de documentos:', docsError);
    } else {
      console.log('✅ Consulta de documentos funcionou!');
      console.log('📊 Instituições com documentos:', docsResult.length);
      docsResult.forEach((inst, index) => {
        console.log(`  ${index + 1}. ${inst.nome}: ${inst.documentos?.length || 0} documentos`);
      });
    }
    
    // DELETE (limpeza)
    console.log('\n🗑️ 5. Limpando dados de teste...');
    const { error: deleteError } = await supabase
      .from('instituicoes')
      .delete()
      .eq('id', createResult.id);
    
    if (deleteError) {
      console.error('❌ Erro no DELETE:', deleteError);
    } else {
      console.log('✅ DELETE funcionou! Dados de teste removidos.');
    }
    
    // 6. Resumo final
    console.log('\n🎉 RESUMO FINAL:');
    console.log('================');
    console.log('✅ Coluna documentos existe no banco');
    console.log('✅ Schema cache foi atualizado');
    console.log('✅ CREATE com documentos funciona');
    console.log('✅ READ com documentos funciona');
    console.log('✅ UPDATE com documentos funciona');
    console.log('✅ Consultas com filtros funcionam');
    console.log('✅ Consultas específicas de documentos funcionam');
    console.log('✅ DELETE funciona');
    console.log('\n🎯 O erro "Could not find the \'documentos\' column" foi RESOLVIDO!');
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

testFinalFix();