const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .limit(5);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Available users:');
    data.forEach(user => {
      console.log(`- ${user.email} (${user.nome})`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();