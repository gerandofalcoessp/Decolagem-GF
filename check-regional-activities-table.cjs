const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente do backend/.env
const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRegionalActivitiesTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela regional_activities...');
    
    // Primeiro, verificar se a tabela existe e buscar alguns registros
    const { data: activities, error } = await supabase
      .from('regional_activities')
      .select('*')
      .limit(3);

    if (error) {
      console.error('❌ Erro ao consultar tabela regional_activities:', error);
      return;
    }

    if (activities && activities.length > 0) {
      console.log('📋 Campos disponíveis na tabela regional_activities:');
      const fields = Object.keys(activities[0]);
      fields.forEach(field => {
        const value = activities[0][field];
        console.log(`  - ${field}: ${typeof value} (exemplo: ${JSON.stringify(value)})`);
      });
      
      console.log(`\n📊 Total de registros encontrados: ${activities.length}`);
      
      console.log('\n📝 Registros completos:');
      activities.forEach((activity, index) => {
        console.log(`\n--- Registro ${index + 1} ---`);
        console.log(JSON.stringify(activity, null, 2));
      });
    } else {
      console.log('⚠️ Nenhum registro encontrado na tabela regional_activities');
    }

    // Verificar também o total de registros na tabela
    const { count, error: countError } = await supabase
      .from('regional_activities')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`\n📈 Total de registros na tabela: ${count}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkRegionalActivitiesTable();