const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugUserMapping() {
  console.log('🔍 Investigando mapeamento entre usuarios e members...\n');
  
  // 1. Verificar se existe um usuário específico em ambas as tabelas
  console.log('1️⃣ Verificando usuário "Flávio Almeida" em ambas as tabelas...');
  
  const { data: usuarioFlavio, error: usuarioError } = await supabase
    .from('usuarios')
    .select('id, nome, email')
    .ilike('nome', '%Flávio%')
    .limit(5);
    
  const { data: memberFlavio, error: memberError } = await supabase
    .from('members')
    .select('id, name, email')
    .ilike('name', '%Flávio%')
    .limit(5);
    
  console.log('👤 Usuários "Flávio" na tabela usuarios:', usuarioFlavio);
  console.log('👤 Members "Flávio" na tabela members:', memberFlavio);
  
  // 2. Verificar se há correspondência entre IDs
  if (usuarioFlavio && memberFlavio && usuarioFlavio.length > 0 && memberFlavio.length > 0) {
    console.log('\n2️⃣ Comparando IDs...');
    console.log('ID na tabela usuarios:', usuarioFlavio[0].id);
    console.log('ID na tabela members:', memberFlavio[0].id);
    console.log('IDs são iguais?', usuarioFlavio[0].id === memberFlavio[0].id);
  }
  
  // 3. Verificar estrutura das tabelas
  console.log('\n3️⃣ Verificando estrutura das tabelas...');
  
  const { data: usuariosStructure, error: usuariosStructError } = await supabase
    .rpc('exec_sql', { 
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        ORDER BY ordinal_position;
      `
    });
    
  const { data: membersStructure, error: membersStructError } = await supabase
    .rpc('exec_sql', { 
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'members' 
        ORDER BY ordinal_position;
      `
    });
    
  if (!usuariosStructError && usuariosStructure) {
    console.log('📊 Estrutura da tabela usuarios:', JSON.stringify(usuariosStructure, null, 2));
  }
  
  if (!membersStructError && membersStructure) {
    console.log('📊 Estrutura da tabela members:', JSON.stringify(membersStructure, null, 2));
  }
  
  // 4. Verificar se há relação entre as tabelas
  console.log('\n4️⃣ Verificando relação entre tabelas...');
  
  const { data: relation, error: relationError } = await supabase
    .rpc('exec_sql', { 
      sql: `
        SELECT 
          u.id as usuario_id,
          u.nome as usuario_nome,
          u.email as usuario_email,
          m.id as member_id,
          m.name as member_nome,
          m.email as member_email
        FROM usuarios u
        FULL OUTER JOIN members m ON u.email = m.email
        WHERE u.nome ILIKE '%Flávio%' OR m.name ILIKE '%Flávio%'
        LIMIT 5;
      `
    });
    
  if (!relationError && relation) {
    console.log('🔗 Relação entre tabelas (por email):', JSON.stringify(relation, null, 2));
  } else {
    console.error('❌ Erro ao verificar relação:', relationError);
  }
}

debugUserMapping().catch(console.error);