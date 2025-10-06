import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function testMemberUpdateWithAuth() {
  try {
    console.log('🧪 Testando atualização de membro com contexto de autenticação...\n');

    // 1. Buscar um usuário super admin para usar como contexto
    console.log('1. Buscando usuário super admin...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários:', authError.message);
      return;
    }

    const superAdminUser = authUsers.users.find(user => 
      user.user_metadata?.role === 'super_admin'
    );

    if (!superAdminUser) {
      console.error('❌ Nenhum usuário super admin encontrado');
      return;
    }

    console.log(`✅ Super admin encontrado: ${superAdminUser.email}`);

    // 2. Criar um token de acesso para o super admin
    console.log('\n2. Criando token de acesso...');
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateAccessToken(superAdminUser.id);
    
    if (tokenError) {
      console.error('❌ Erro ao gerar token:', tokenError.message);
      return;
    }

    console.log('✅ Token gerado com sucesso');

    // 3. Configurar cliente com o token
    await supabaseClient.auth.setSession({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || ''
    });

    // 4. Buscar o membro problemático
    console.log('\n3. Buscando membro para atualizar...');
    const { data: member, error: findError } = await supabaseClient
      .from('members')
      .select('*')
      .eq('email', 'flavioalmeidaf3@gmail.com')
      .single();

    if (findError) {
      console.error('❌ Erro ao buscar membro:', findError.message);
      return;
    }

    console.log(`✅ Membro encontrado: ${member.name} (ID: ${member.id})`);

    // 5. Tentar atualizar o membro
    console.log('\n4. Tentando atualizar membro...');
    const updateData = {
      name: member.name, // Mesmo valor para não alterar nada
      funcao: member.funcao || 'Líder Regional'
    };

    const { data: updatedMember, error: updateError } = await supabaseClient
      .from('members')
      .update(updateData)
      .eq('id', member.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Erro na atualização:', updateError.message);
      console.error('Código:', updateError.code);
      console.error('Detalhes:', updateError.details);
      console.error('Hint:', updateError.hint);
      return;
    }

    console.log('✅ Atualização bem-sucedida!');
    console.log('📋 Dados atualizados:', {
      id: updatedMember.id,
      name: updatedMember.name,
      email: updatedMember.email,
      funcao: updatedMember.funcao
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testMemberUpdateWithAuth();