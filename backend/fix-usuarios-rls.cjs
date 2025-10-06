require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('🔧 Aplicando correção para recursão infinita nas políticas RLS...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Ler o arquivo de migração
  const migrationPath = path.join(process.cwd(), 'database', 'migrations', '20250121_fix_usuarios_rls_infinite_recursion.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📄 Executando migração SQL...');
  
  // Executar a migração
  const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
  
  if (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Migração aplicada com sucesso!');
  
  // Verificar as políticas após a migração
  console.log('\n🔍 Verificando políticas RLS após correção...');
  const policiesSQL = `
    SELECT policyname, cmd, qual
    FROM pg_policies 
    WHERE tablename = 'usuarios'
    ORDER BY policyname;
  `;
  
  const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
    sql: policiesSQL
  });
  
  if (policiesError) {
    console.error('❌ Erro ao verificar políticas:', policiesError.message);
  } else {
    console.log('✅ Políticas RLS atuais na tabela usuarios:');
    policies.forEach(policy => {
      console.log(`  - ${policy.policyname} (${policy.cmd})`);
    });
  }
  
  // Testar conexão básica após correção
  console.log('\n🧪 Testando conexão básica após correção...');
  const { data: testData, error: testError } = await supabase
    .from('usuarios')
    .select('id, name, email, role')
    .limit(1);
  
  if (testError) {
    console.error('❌ Ainda há erro na conexão:', testError.message);
  } else {
    console.log('✅ Conexão com tabela usuarios funcionando!');
    console.log('📊 Dados de teste:', testData);
  }
}

applyMigration().catch(console.error);