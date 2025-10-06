const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Iniciando migração: Update Regionais to Área...');
    
    // Primeiro, vamos verificar quantos registros têm "Regionais" na descrição
    const { data: beforeData, error: beforeError } = await supabase
      .from('goals')
      .select('id, nome, descricao')
      .ilike('descricao', '%regionais%');
    
    if (beforeError) {
      console.error('❌ Erro ao verificar registros antes da migração:', beforeError);
      return;
    }
    
    console.log(`📊 Encontrados ${beforeData.length} registros com "Regionais" na descrição`);
    
    // Executar a atualização usando uma abordagem mais simples
    console.log('🔄 Atualizando registros individualmente...');
    
    // Buscar todos os registros com "Regionais"
    const { data: goalsWithRegionais, error: fetchError } = await supabase
      .from('goals')
      .select('id, descricao')
      .ilike('descricao', '%regionais%');
    
    if (fetchError) {
      console.error('❌ Erro ao buscar registros:', fetchError);
      return;
    }
    
    console.log(`🔄 Atualizando ${goalsWithRegionais.length} registros individualmente...`);
    
    let updatedCount = 0;
    for (const goal of goalsWithRegionais) {
      const updatedDescription = goal.descricao
        .replace(/(\|\s*)Regionais(\s*:\s*)/gi, '$1Área$2')
        .replace(/\bregionais\b/gi, 'área');
      
      const { error: individualUpdateError } = await supabase
        .from('goals')
        .update({ descricao: updatedDescription })
        .eq('id', goal.id);
      
      if (individualUpdateError) {
        console.error(`❌ Erro ao atualizar registro ${goal.id}:`, individualUpdateError);
      } else {
        console.log(`✅ Atualizado: ${goal.id}`);
        updatedCount++;
      }
    }
    
    console.log(`✅ Atualização concluída: ${updatedCount} registros atualizados`);
    
    // Verificar o resultado final
    const { data: afterData, error: afterError } = await supabase
      .from('goals')
      .select('id, nome, descricao')
      .ilike('descricao', '%área%');
    
    if (afterError) {
      console.error('❌ Erro ao verificar registros após migração:', afterError);
      return;
    }
    
    console.log('\n✅ Migração concluída!');
    console.log(`📊 Registros com "Área" na descrição: ${afterData.length}`);
    
    console.log('\n📝 Exemplos de registros atualizados:');
    afterData.slice(0, 3).forEach(goal => {
      console.log(`  - ID: ${goal.id}, Nome: ${goal.nome}`);
      console.log(`    Descrição: ${goal.descricao}`);
    });
    
  } catch (error) {
    console.error('❌ Erro geral na migração:', error);
  }
}

runMigration();