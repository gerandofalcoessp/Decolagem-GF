const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  console.log('🔍 Verificando usuários na tabela usuarios...');
  
  const { data: usuarios, error: usuariosError } = await supabase
    .from('usuarios')
    .select('id, nome, email')
    .limit(5);
    
  if (usuariosError) {
    console.error('❌ Erro ao buscar usuários:', usuariosError);
    return;
  }
  
  console.log('👥 Usuários encontrados:', usuarios?.length || 0);
  if (usuarios && usuarios.length > 0) {
    console.log('📋 Primeiros usuários:');
    usuarios.forEach(u => console.log('  -', u.id, '|', u.nome, '|', u.email));
  }
  
  console.log('\n🔍 Verificando constraint da tabela regional_activities...');
  
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
    
  if (!constraintError && constraints) {
    console.log('🔗 Constraint da coluna responsavel_id:', constraints);
  } else {
    console.error('❌ Erro ao verificar constraints:', constraintError);
  }
}

checkUsers().catch(console.error);