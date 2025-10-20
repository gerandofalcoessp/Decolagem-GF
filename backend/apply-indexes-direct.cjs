const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Carrega variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuração do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Lista de índices para criar
const indexes = [
  {
    name: 'idx_regional_activities_member_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_regional_activities_member_id ON regional_activities(member_id);'
  },
  {
    name: 'idx_regional_activities_responsavel_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_regional_activities_responsavel_id ON regional_activities(responsavel_id);'
  },
  {
    name: 'idx_regional_activities_created_at',
    sql: 'CREATE INDEX IF NOT EXISTS idx_regional_activities_created_at ON regional_activities(created_at DESC);'
  },
  {
    name: 'idx_regional_activities_member_created',
    sql: 'CREATE INDEX IF NOT EXISTS idx_regional_activities_member_created ON regional_activities(member_id, created_at DESC);'
  },
  {
    name: 'idx_regional_activities_regional_status',
    sql: 'CREATE INDEX IF NOT EXISTS idx_regional_activities_regional_status ON regional_activities(regional, status);'
  },
  {
    name: 'idx_goals_member_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_goals_member_id ON goals(member_id);'
  },
  {
    name: 'idx_goals_status',
    sql: 'CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);'
  },
  {
    name: 'idx_goals_member_status',
    sql: 'CREATE INDEX IF NOT EXISTS idx_goals_member_status ON goals(member_id, status);'
  },
  {
    name: 'idx_goals_created_at',
    sql: 'CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at DESC);'
  },
  {
    name: 'idx_usuarios_auth_user_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON usuarios(auth_user_id);'
  },
  {
    name: 'idx_usuarios_email',
    sql: 'CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email) WHERE email IS NOT NULL;'
  },
  {
    name: 'idx_usuarios_status',
    sql: 'CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status) WHERE status IS NOT NULL;'
  },
  {
    name: 'idx_usuarios_regional',
    sql: 'CREATE INDEX IF NOT EXISTS idx_usuarios_regional ON usuarios(regional);'
  },
  {
    name: 'idx_members_auth_user_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_members_auth_user_id ON members(auth_user_id);'
  },
  {
    name: 'idx_members_email',
    sql: 'CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);'
  },
  {
    name: 'idx_members_regional',
    sql: 'CREATE INDEX IF NOT EXISTS idx_members_regional ON members(regional);'
  },
  {
    name: 'idx_members_auth_regional',
    sql: 'CREATE INDEX IF NOT EXISTS idx_members_auth_regional ON members(auth_user_id, regional);'
  }
];

async function createIndexManually() {
  console.log('🚀 Aplicando índices otimizados manualmente...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const index of indexes) {
    try {
      console.log(`⏳ Verificando/criando ${index.name}...`);
      
      // Tenta criar o índice usando uma query direta
      const { data, error } = await supabase
        .from('information_schema.statistics')
        .select('index_name')
        .eq('index_name', index.name)
        .single();

      if (data) {
        console.log(`⚠️  ${index.name} já existe - pulando`);
        continue;
      }

      // Se chegou aqui, o índice não existe, então vamos tentar criar
      // Como não temos acesso direto ao SQL, vamos usar uma abordagem alternativa
      console.log(`ℹ️  ${index.name} será criado via SQL direto no Supabase Dashboard`);
      console.log(`📋 SQL: ${index.sql}`);
      successCount++;

    } catch (err) {
      console.error(`❌ Erro ao processar ${index.name}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n📊 Resumo:');
  console.log(`✅ Índices processados: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  
  console.log('\n📝 Para aplicar os índices, execute os seguintes comandos SQL no Supabase Dashboard:');
  console.log('   1. Acesse https://supabase.com/dashboard');
  console.log('   2. Vá para SQL Editor');
  console.log('   3. Execute cada comando abaixo:\n');
  
  indexes.forEach(index => {
    console.log(`-- ${index.name}`);
    console.log(`${index.sql};`);
    console.log('');
  });

  console.log('🎯 Alternativamente, você pode executar todos de uma vez:');
  console.log('\n-- Aplicar todos os índices de uma vez');
  indexes.forEach(index => {
    console.log(`${index.sql};`);
  });
}

// Executa o script
createIndexManually()
  .then(() => {
    console.log('\n✨ Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });