const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugConstraint() {
  console.log('🔍 Investigando a constraint de chave estrangeira...\n');
  
  // 1. Verificar a estrutura da constraint
  console.log('1️⃣ Verificando constraint regional_activities_responsavel_id_fkey...');
  
  const { data: constraints, error: constraintError } = await supabase
    .rpc('exec_sql', { 
      sql: `
        SELECT 
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name='regional_activities'
          AND kcu.column_name = 'responsavel_id';
      `
    });
    
  if (constraintError) {
    console.error('❌ Erro ao verificar constraints:', constraintError);
  } else {
    console.log('🔗 Constraint encontrada:', JSON.stringify(constraints, null, 2));
  }
  
  // 2. Verificar usuários na tabela usuarios
  console.log('\n2️⃣ Verificando usuários na tabela usuarios...');
  
  const { data: usuarios, error: usuariosError } = await supabase
    .from('usuarios')
    .select('id, nome, email')
    .limit(10);
    
  if (usuariosError) {
    console.error('❌ Erro ao buscar usuários:', usuariosError);
  } else {
    console.log('👥 Usuários encontrados:', usuarios?.length || 0);
    if (usuarios && usuarios.length > 0) {
      console.log('📋 Usuários:');
      usuarios.forEach(u => console.log(`  - ${u.id} | ${u.nome} | ${u.email}`));
    }
  }
  
  // 3. Verificar usuários na tabela members
  console.log('\n3️⃣ Verificando usuários na tabela members...');
  
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, name, email')
    .limit(10);
    
  if (membersError) {
    console.error('❌ Erro ao buscar members:', membersError);
  } else {
    console.log('👥 Members encontrados:', members?.length || 0);
    if (members && members.length > 0) {
      console.log('📋 Members:');
      members.forEach(m => console.log(`  - ${m.id} | ${m.name} | ${m.email}`));
    }
  }
  
  // 4. Verificar estrutura da tabela regional_activities
  console.log('\n4️⃣ Verificando estrutura da tabela regional_activities...');
  
  const { data: structure, error: structError } = await supabase
    .rpc('exec_sql', { 
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'regional_activities' 
        AND column_name IN ('responsavel_id', 'member_id')
        ORDER BY column_name;
      `
    });
    
  if (!structError && structure) {
    console.log('📊 Estrutura das colunas:', JSON.stringify(structure, null, 2));
  } else {
    console.error('❌ Erro ao verificar estrutura:', structError);
  }
}

debugConstraint().catch(console.error);