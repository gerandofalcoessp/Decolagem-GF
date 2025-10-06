const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixConstraint() {
  try {
    console.log('🔧 Corrigindo constraint da tabela regional_activities...');
    
    // 1. Remover a constraint atual que aponta para usuarios
    console.log('1️⃣ Removendo constraint atual...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE regional_activities DROP CONSTRAINT IF EXISTS regional_activities_responsavel_id_fkey;'
    });
    
    if (dropError) {
      console.error('❌ Erro ao remover constraint:', dropError);
      return;
    }
    
    console.log('✅ Constraint removida com sucesso');
    
    // 2. Criar nova constraint que aponta para members
    console.log('2️⃣ Criando nova constraint para tabela members...');
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE regional_activities 
            ADD CONSTRAINT regional_activities_responsavel_id_fkey 
            FOREIGN KEY (responsavel_id) REFERENCES members(id) ON DELETE SET NULL;`
    });
    
    if (createError) {
      console.error('❌ Erro ao criar nova constraint:', createError);
      return;
    }
    
    console.log('✅ Nova constraint criada com sucesso');
    
    // 3. Verificar a nova constraint
    console.log('3️⃣ Verificando nova constraint...');
    const { data: constraints, error: checkError } = await supabase.rpc('exec_sql', {
      sql: `SELECT 
              tc.constraint_name,
              tc.table_name,
              kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = 'regional_activities'
              AND kcu.column_name = 'responsavel_id';`
    });
    
    if (checkError) {
      console.error('❌ Erro ao verificar constraint:', checkError);
      return;
    }
    
    console.log('📊 Constraint verificada:', constraints);
    console.log('🎉 Correção concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

fixConstraint();