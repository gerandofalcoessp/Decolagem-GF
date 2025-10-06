const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listUsers() {
  console.log('🔍 Listando usuários existentes...\n');
  
  try {
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Erro:', error.message);
      return;
    }
    
    console.log('📊 Total de usuários:', users.users.length);
    
    users.users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.user_metadata?.role || 'N/A'}`);
      console.log(`   Criado em: ${user.created_at}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

listUsers();