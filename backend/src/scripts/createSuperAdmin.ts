import 'dotenv/config';
import { supabaseAdmin } from '../services/supabaseClient';

interface SuperAdminData {
  email: string;
  password: string;
  nome: string;
  regional?: string;
}

class SuperAdminCreator {
  /**
   * Cria um usuário super admin no sistema
   */
  async createSuperAdmin(data: SuperAdminData): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase Admin não configurado. Verifique as variáveis de ambiente.');
    }

    console.log('🚀 Iniciando criação do super admin...');

    try {
      // 1. Criar usuário no Supabase Auth
      console.log('📝 Criando usuário no Supabase Auth...');
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Auto-confirma o email
        user_metadata: {
          nome: data.nome,
          role: 'super_admin',
          regional: data.regional || null,
        },
      });

      if (authError) {
        throw new Error(`Erro ao criar usuário no Auth: ${authError.message}`);
      }

      if (!authUser.user) {
        throw new Error('Usuário não foi criado corretamente');
      }

      console.log(`✅ Usuário criado no Auth com ID: ${authUser.user.id}`);

      // 2. Verificar se existe regional (se fornecida)
      let regionalId = null;
      if (data.regional) {
        console.log(`🔍 Verificando regional: ${data.regional}`);
        const { data: regional, error: regionalError } = await supabaseAdmin
          .from('regionals')
          .select('id')
          .eq('name', data.regional)
          .single();

        if (regionalError && regionalError.code !== 'PGRST116') {
          throw new Error(`Erro ao buscar regional: ${regionalError.message}`);
        }

        if (!regional) {
          // Criar regional se não existir
          console.log(`📝 Criando regional: ${data.regional}`);
          const { data: newRegional, error: createRegionalError } = await supabaseAdmin
            .from('regionals')
            .insert({ name: data.regional })
            .select('id')
            .single();

          if (createRegionalError) {
            throw new Error(`Erro ao criar regional: ${createRegionalError.message}`);
          }

          regionalId = newRegional.id;
          console.log(`✅ Regional criada com ID: ${regionalId}`);
        } else {
          regionalId = regional.id;
          console.log(`✅ Regional encontrada com ID: ${regionalId}`);
        }
      }

      // 3. Criar entrada na tabela members
      console.log('📝 Criando entrada na tabela members...');
      const { data: member, error: memberError } = await supabaseAdmin
        .from('members')
        .insert({
          auth_user_id: authUser.user.id,
          regional_id: regionalId,
          name: data.nome,
          email: data.email,
        })
        .select()
        .single();

      if (memberError) {
        // Se falhar, tentar limpar o usuário criado
        console.error('❌ Erro ao criar member, tentando limpar usuário...');
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new Error(`Erro ao criar member: ${memberError.message}`);
      }

      console.log(`✅ Member criado com ID: ${member.id}`);

      console.log('\n🎉 Super admin criado com sucesso!');
      console.log('📧 Email:', data.email);
      console.log('🔑 Senha:', data.password);
      console.log('👤 Nome:', data.nome);
      console.log('🏢 Regional:', data.regional || 'Não definida');
      console.log('\n⚠️  IMPORTANTE: Guarde essas credenciais em local seguro!');

    } catch (error) {
      console.error('❌ Erro ao criar super admin:', error);
      throw error;
    }
  }

  /**
   * Lista usuários super admin existentes
   */
  async listSuperAdmins(): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase Admin não configurado');
    }

    console.log('🔍 Buscando super admins existentes...');

    const { data: members, error } = await supabaseAdmin
      .from('members')
      .select(`
        id,
        name,
        email,
        created_at,
        regionals (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar members: ${error.message}`);
    }

    if (!members || members.length === 0) {
      console.log('📭 Nenhum member encontrado');
      return;
    }

    console.log('\n📋 Members encontrados:');
    members.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} (${member.email})`);
      console.log(`   Regional: ${member.regionals?.name || 'Não definida'}`);
      console.log(`   Criado em: ${new Date(member.created_at).toLocaleString('pt-BR')}`);
      console.log('');
    });
  }
}

// CLI
async function main() {
  console.log('🔧 Script iniciado com argumentos:', process.argv);
  const args = process.argv.slice(2);
  const command = args[0];
  const creator = new SuperAdminCreator();

  switch (command) {
    case 'create':
      const email = args[1];
      const password = args[2];
      const nome = args[3];
      const regional = args[4];

      if (!email || !password || !nome) {
        console.error('❌ Parâmetros obrigatórios: email, password, nome');
        console.log('Uso: npm run create-super-admin create <email> <password> <nome> [regional]');
        console.log('Exemplo: npm run create-super-admin create admin@decolagem.com Admin@123 "Administrador Geral" "São Paulo"');
        process.exit(1);
      }

      await creator.createSuperAdmin({
        email,
        password,
        nome,
        regional,
      });
      break;

    case 'list':
      await creator.listSuperAdmins();
      break;

    default:
      console.log('🛠️  Comandos disponíveis:');
      console.log('  npm run create-super-admin create <email> <password> <nome> [regional] - Cria novo super admin');
      console.log('  npm run create-super-admin list - Lista members existentes');
      console.log('');
      console.log('📝 Exemplo:');
      console.log('  npm run create-super-admin create admin@decolagem.com Admin@123 "Administrador Geral" "São Paulo"');
      break;
  }
}

// Executar sempre que o script for chamado diretamente
main().catch((error) => {
  console.error('💥 Erro fatal:', error.message);
  process.exit(1);
});

export { SuperAdminCreator };