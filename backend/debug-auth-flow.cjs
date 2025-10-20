const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Simular a função getMemberData do AuthService
async function getMemberData(userId) {
  try {
    console.log(`🔍 Buscando dados do usuário: ${userId}`);

    // Buscar os dados do usuário na tabela usuarios
    const { data: userData, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar usuário na tabela usuarios:', userError);
      
      // Fallback: buscar dados do Auth se não encontrar na tabela usuarios
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (authError) {
        console.error('❌ Erro ao buscar usuário no Supabase Auth:', authError);
        return null;
      }

      console.log('⚠️ Usuário não encontrado na tabela usuarios, usando dados do Auth:', userId);
      return {
        id: userId,
        name: authUser.user.user_metadata?.nome || authUser.user.email,
        email: authUser.user.email,
        role: authUser.user.user_metadata?.role || null,
        auth_user_id: userId,
        funcao: authUser.user.user_metadata?.funcao || null,
        area: authUser.user.user_metadata?.regional || null,
        regional: authUser.user.user_metadata?.regional || null,
        tipo: authUser.user.user_metadata?.tipo || null,
        status: 'ativo'
      };
    }

    console.log('✅ Usuário encontrado na tabela usuarios');
    // Retornar dados da tabela usuarios
    return {
      id: userData.id,
      auth_user_id: userData.auth_user_id,
      name: userData.nome,
      email: userData.email,
      role: userData.permissao || userData.role, // Usar permissao primeiro, fallback para role
      funcao: userData.funcao,
      area: userData.area,
      regional: userData.regional,
      tipo: userData.tipo,
      status: userData.status,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    };
  } catch (error) {
    console.error('❌ Erro ao obter dados do usuário:', error);
    return null;
  }
}

async function testAuthFlow() {
  try {
    console.log('🧪 Testando fluxo de autenticação...\n');
    
    // Buscar o usuário super_admin
    const { data: usuario, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', 'flavioalmeidaf3@gmail.com')
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      return;
    }
    
    console.log('👤 Usuário encontrado:');
    console.log(`   Nome: ${usuario.nome}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Role: ${usuario.role || usuario.permissao}`);
    console.log(`   Auth User ID: ${usuario.auth_user_id}\n`);
    
    // Testar getMemberData
    console.log('🔍 Testando getMemberData...');
    const memberData = await getMemberData(usuario.auth_user_id);
    
    if (memberData) {
      console.log('✅ getMemberData retornou:');
      console.log(`   ID: ${memberData.id}`);
      console.log(`   Nome: ${memberData.name}`);
      console.log(`   Email: ${memberData.email}`);
      console.log(`   Role: ${memberData.role}`);
      console.log(`   Regional: ${memberData.regional}`);
      console.log(`   Função: ${memberData.funcao}\n`);
      
      // Testar verificação de permissão
      const allowedRoles = ['super_admin', 'equipe_interna'];
      const hasPermission = allowedRoles.includes(memberData.role);
      
      console.log('🔐 Verificação de permissão:');
      console.log(`   Roles permitidas: ${allowedRoles.join(', ')}`);
      console.log(`   Role do usuário: ${memberData.role}`);
      console.log(`   Tem permissão: ${hasPermission ? '✅ SIM' : '❌ NÃO'}`);
      
      if (!hasPermission) {
        console.log('\n💡 PROBLEMA IDENTIFICADO:');
        console.log('   O usuário não tem uma role válida para acessar o endpoint');
        console.log('   Roles válidas: super_admin, equipe_interna');
        console.log(`   Role atual: ${memberData.role}`);
      }
    } else {
      console.log('❌ getMemberData retornou null');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testAuthFlow();