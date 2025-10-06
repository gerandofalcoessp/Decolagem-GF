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

async function migrateDataToUsuarios() {
  console.log('🚀 Iniciando migração de dados para tabela usuarios...\n');

  try {
    // 1. Verificar se a tabela usuarios existe
    console.log('🔍 Verificando tabela usuarios...');
    const { data: existingUsers, error: checkError } = await supabase
      .from('usuarios')
      .select('auth_user_id')
      .limit(1);

    if (checkError) {
      console.error('❌ Tabela usuarios não encontrada:', checkError);
      return;
    }

    console.log('✅ Tabela usuarios encontrada\n');

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

    // 4. Verificar usuários já migrados
    const { data: existingUsuarios, error: existingError } = await supabase
      .from('usuarios')
      .select('auth_user_id');

    if (existingError) {
      console.error('❌ Erro ao verificar usuários existentes:', existingError);
      return;
    }

    const existingAuthIds = new Set(existingUsuarios.map(u => u.auth_user_id));
    console.log(`📋 ${existingUsuarios.length} usuários já migrados\n`);

    // 5. Criar mapa de members por auth_user_id
    const membersMap = new Map();
    membersData.forEach(member => {
      if (member.auth_user_id) {
        membersMap.set(member.auth_user_id, member);
      }
    });

    // 6. Migrar cada usuário que ainda não foi migrado
    console.log('🔄 Iniciando migração de usuários...\n');
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const authUser of authUsers.users) {
      try {
        // Pular se já foi migrado
        if (existingAuthIds.has(authUser.id)) {
          console.log(`⏭️  Usuário já migrado: ${authUser.email}`);
          skippedCount++;
          continue;
        }

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

        console.log(`📝 Migrando: ${authUser.email}`);
        console.log(`   Nome: ${usuarioData.nome}`);
        console.log(`   Função: ${usuarioData.funcao || 'Não definida'}`);
        console.log(`   Role: ${usuarioData.role}`);

        // Inserir na tabela usuarios
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert(usuarioData);

        if (insertError) {
          console.error(`❌ Erro ao migrar usuário ${authUser.email}:`, insertError);
          errorCount++;
        } else {
          console.log(`✅ Usuário migrado com sucesso: ${authUser.email}\n`);
          successCount++;
        }

      } catch (error) {
        console.error(`❌ Erro inesperado ao migrar usuário ${authUser.email}:`, error);
        errorCount++;
      }
    }

    // 7. Relatório final
    console.log('\n📊 RELATÓRIO DE MIGRAÇÃO:');
    console.log(`✅ Usuários migrados com sucesso: ${successCount}`);
    console.log(`⏭️  Usuários já existentes (pulados): ${skippedCount}`);
    console.log(`❌ Erros durante migração: ${errorCount}`);
    console.log(`📋 Total de usuários processados: ${authUsers.users.length}`);

    // 8. Verificar dados migrados
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
      console.log(`- ${usuario.nome} (${usuario.email})`);
      console.log(`  Role: ${usuario.role} | Função: ${usuario.funcao || 'Não definida'} | Regional: ${usuario.regional || 'Não definida'}`);
      console.log('');
    });

    console.log('🎉 Migração de dados concluída com sucesso!');
    
    // 9. Próximos passos
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. ✅ Tabela usuarios criada');
    console.log('2. ✅ Dados migrados');
    console.log('3. 🔄 Atualizar endpoints para usar a tabela usuarios');
    console.log('4. 🔄 Atualizar hooks do frontend');
    console.log('5. 🔄 Testar toda a funcionalidade');
    console.log('6. 🔄 Após validação, considerar deprecar a tabela members');

  } catch (error) {
    console.error('❌ Erro geral durante migração:', error);
  }
}

// Executar migração
migrateDataToUsuarios();