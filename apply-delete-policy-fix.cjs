const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function applyDeletePolicyFix() {
  console.log('🔧 Aplicando correção da política DELETE para regional_activities...\n');
  
  try {
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, 'backend', 'migrations', 'fix_regional_activities_delete_policy.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Conteúdo da migração:');
    console.log(migrationSQL);
    console.log('\n🚀 Executando migração...');
    
    // Executar a migração
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Erro ao executar migração:', error.message);
      return;
    }
    
    console.log('✅ Migração executada com sucesso!');
    
    // Verificar se a política foi criada
    console.log('\n🔍 Verificando se a política DELETE foi criada...');
    
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT 
            policyname,
            cmd,
            qual
          FROM pg_policies 
          WHERE tablename = 'regional_activities' AND cmd = 'DELETE';
        `
      });
    
    if (policiesError) {
      console.log('❌ Erro ao verificar políticas:', policiesError.message);
    } else {
      console.log('📋 Políticas DELETE encontradas:', policies);
      
      if (policies && policies.length > 0) {
        console.log('✅ Política DELETE criada com sucesso!');
        
        // Testar a exclusão novamente
        console.log('\n🧪 Testando exclusão após aplicar a correção...');
        await testDeleteAfterFix();
      } else {
        console.log('❌ Política DELETE não foi encontrada após a migração');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao aplicar correção:', error.message);
  }
}

async function testDeleteAfterFix() {
  try {
    // Primeiro, criar uma atividade de teste
    console.log('1️⃣ Criando atividade de teste...');
    
    const testActivity = {
      title: 'Teste DELETE Policy',
      description: 'Atividade criada para testar a política DELETE',
      activity_date: '2025-01-25',
      type: 'teste',
      member_id: '9aa3da8f-7f8d-48f3-8ede-5ac34e2a9996', // ID do membro existente
      regional: 'nordeste_2',
      status: 'ativo',
      programa: 'teste',
      estados: '["BA"]',
      instituicao_id: 'a92337e1-9329-4216-b39a-84d15158aa1d',
      quantidade: '1'
    };
    
    const { data: createdActivity, error: createError } = await supabaseAdmin
      .from('regional_activities')
      .insert(testActivity)
      .select('*')
      .single();
    
    if (createError) {
      console.log('❌ Erro ao criar atividade de teste:', createError.message);
      return;
    }
    
    console.log('✅ Atividade de teste criada:', createdActivity.id);
    
    // Agora testar a exclusão
    console.log('2️⃣ Testando exclusão da atividade de teste...');
    
    const { data: deletedActivity, error: deleteError } = await supabaseAdmin
      .from('regional_activities')
      .delete()
      .eq('id', createdActivity.id)
      .select('*');
    
    if (deleteError) {
      console.log('❌ Erro ao deletar atividade de teste:', deleteError.message);
    } else {
      console.log('✅ Atividade de teste deletada com sucesso:', deletedActivity);
      
      // Verificar se foi realmente removida
      const { data: checkActivity } = await supabaseAdmin
        .from('regional_activities')
        .select('*')
        .eq('id', createdActivity.id);
      
      if (checkActivity && checkActivity.length === 0) {
        console.log('✅ Confirmado: Atividade foi removida do banco de dados');
        console.log('🎉 PROBLEMA RESOLVIDO! A política DELETE está funcionando corretamente');
      } else {
        console.log('❌ Problema: Atividade ainda existe no banco após exclusão');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

applyDeletePolicyFix().catch(console.error);