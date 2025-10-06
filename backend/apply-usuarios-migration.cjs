const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyUsuariosMigration() {
  console.log('🚀 Aplicando migration da tabela usuarios...\n');

  try {
    // SQL para criar a tabela usuarios
    const createTableSQL = `
      -- Create usuarios table
      CREATE TABLE IF NOT EXISTS usuarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        funcao VARCHAR(100),
        area VARCHAR(100),
        regional VARCHAR(100),
        tipo VARCHAR(50),
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'ativo',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Executar criação da tabela
    console.log('📋 Criando tabela usuarios...');
    const { error: createError } = await supabase
      .from('usuarios')
      .select('id')
      .limit(1);

    // Se a tabela não existe, vamos criá-la usando uma abordagem diferente
    if (createError && createError.code === 'PGRST205') {
      console.log('⚠️  Tabela usuarios não existe, criando via SQL direto...');
      
      // Usar uma query SQL direta através de uma função personalizada
      const { error: sqlError } = await supabase.rpc('execute_sql', { 
        query: createTableSQL 
      });

      if (sqlError) {
        console.log('⚠️  Função execute_sql não disponível, tentando abordagem alternativa...');
        
        // Vamos criar um arquivo SQL e instruir o usuário a executá-lo manualmente
        const fs = require('fs');
        const path = require('path');
        
        const sqlFilePath = path.join(__dirname, 'create_usuarios_table.sql');
        fs.writeFileSync(sqlFilePath, createTableSQL);
        
        console.log(`📄 Arquivo SQL criado: ${sqlFilePath}`);
        console.log('📋 Execute o seguinte comando no seu banco de dados:');
        console.log(`   psql -h <host> -U <user> -d <database> -f ${sqlFilePath}`);
        console.log('   ou execute o SQL diretamente no Supabase Dashboard');
        
        return;
      }
    }

    // Criar índices
    const indexesSQL = [
      'CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON usuarios(auth_user_id);',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_funcao ON usuarios(funcao);',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_area ON usuarios(area);',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_regional ON usuarios(regional);'
    ];

    console.log('📊 Criando índices...');
    for (const indexSQL of indexesSQL) {
      try {
        await supabase.rpc('execute_sql', { query: indexSQL });
      } catch (error) {
        console.log(`⚠️  Não foi possível criar índice automaticamente: ${indexSQL}`);
      }
    }

    // Verificar se a tabela foi criada
    console.log('🔍 Verificando se a tabela foi criada...');
    const { data, error: checkError } = await supabase
      .from('usuarios')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ Tabela usuarios ainda não foi criada:', checkError);
      console.log('\n📋 INSTRUÇÕES MANUAIS:');
      console.log('1. Acesse o Supabase Dashboard');
      console.log('2. Vá para SQL Editor');
      console.log('3. Execute o conteúdo do arquivo: database/migrations/20250121_create_usuarios_table.sql');
      return;
    }

    console.log('✅ Tabela usuarios criada com sucesso!');
    console.log('🎉 Migration aplicada com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante aplicação da migration:', error);
    console.log('\n📋 SOLUÇÃO ALTERNATIVA:');
    console.log('Execute manualmente o arquivo: database/migrations/20250121_create_usuarios_table.sql');
    console.log('no Supabase Dashboard > SQL Editor');
  }
}

// Executar aplicação da migration
applyUsuariosMigration();