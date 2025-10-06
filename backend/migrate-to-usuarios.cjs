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

async function migrateToUsuarios() {
  console.log('🚀 Iniciando migração para tabela usuarios...\n');

  try {
    // 1. Aplicar migration da tabela usuarios
    console.log('📋 Aplicando migration da tabela usuarios...');
    const fs = require('fs');
    const path = require('path');
    
    const migrationPath = path.join(__dirname, 'database', 'migrations', '20250121_create_usuarios_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    if (migrationError) {
      console.error('❌ Erro ao aplicar migration:', migrationError);
      return;
    }
    console.log('✅ Migration aplicada com sucesso\n');

    // 2. Buscar todos os usuários do Supabase Auth
    console.log('👥 Buscando usuários do Supabase Auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários:', authError);
      return;
    }
    
    console.log(`📊 Encontrados ${authUsers.users.length} usuários no Auth\n`);

    // 3. Buscar dados da tabela members
    console.log('📋 Buscando dados da tabela members...');
    const { data: membersData, error: membersError } = await supabase
      .from('members')
      .select('*');
    
    if (membersError) {
      console.error('❌ Erro ao buscar members:', membersError);
      return;
    }
    
    console.log(`📊 Encontrados ${membersData.length} registros na tabela members\n`);

    // 4. Criar mapa de members por auth_user_id
    const membersMap = new Map();
    membersData.forEach(member => {
      if (member.auth_user_id) {
        membersMap.set(member.auth_user_id, member);
      }
    });

    // 5. Migrar cada usuário
    console.log('🔄 Iniciando migração de usuários...\n');
    let successCount = 0;
    let errorCount = 0;

    for (const authUser of authUsers.users) {
      try {
        const userMetadata = authUser.user_metadata || {};
        const memberData = membersMap.get(authUser.id);
        
        // Combinar dados do user_metadata e members
        const usuarioData = {
          auth_user_id: authUser.id,
          email: authUser.email,
          nome: userMetadata.nome || memberData?.name || authUser.email.split('@')[0],
          funcao: userMetadata.funcao || memberData?.funcao || null,
          area: userMetadata.area || memberData?.area || null,
          regional: userMetadata.regional || null,
          tipo: userMetadata.tipo || null,
          role: userMetadata.role || 'user',
          status: 'ativo',
          created_at: authUser.created_at
        };

        // Inserir na tabela usuarios
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert(usuarioData);

        if (insertError) {
          console.error(`❌ Erro ao migrar usuário ${authUser.email}:`, insertError);
          errorCount++;
        } else {
          console.log(`✅ Usuário migrado: ${authUser.email}`);
          successCount++;
        }

      } catch (error) {
        console.error(`❌ Erro inesperado ao migrar usuário ${authUser.email}:`, error);
        errorCount++;
      }
    }

    // 6. Relatório final
    console.log('\n📊 RELATÓRIO DE MIGRAÇÃO:');
    console.log(`✅ Usuários migrados com sucesso: ${successCount}`);
    console.log(`❌ Erros durante migração: ${errorCount}`);
    console.log(`📋 Total de usuários processados: ${authUsers.users.length}`);

    // 7. Verificar dados migrados
    console.log('\n🔍 Verificando dados migrados...');
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: true });

    if (usuariosError) {
      console.error('❌ Erro ao verificar dados migrados:', usuariosError);
      return;
    }

    console.log(`\n📋 USUÁRIOS NA TABELA USUARIOS (${usuariosData.length}):`);
    usuariosData.forEach(usuario => {
      console.log(`- ${usuario.nome} (${usuario.email}) - ${usuario.role} - ${usuario.funcao || 'Sem função'}`);
    });

    console.log('\n🎉 Migração concluída com sucesso!');
    
    // 8. Próximos passos
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. Verificar se todos os dados foram migrados corretamente');
    console.log('2. Atualizar endpoints para usar a tabela usuarios');
    console.log('3. Atualizar hooks do frontend');
    console.log('4. Testar toda a funcionalidade');
    console.log('5. Após validação, considerar deprecar a tabela members');

  } catch (error) {
    console.error('❌ Erro geral durante migração:', error);
  }
}

// Executar migração
migrateToUsuarios();