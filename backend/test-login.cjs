const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_ANON_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('🔐 Testando login do usuário lemaestro@gerandofalcoes.com...\n');

  try {
    // Tentar fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'lemaestro@gerandofalcoes.com',
      password: 'Gf@2024!' // Senha padrão que foi definida
    });

    if (error) {
      console.error('❌ Erro no login:', error.message);
      return;
    }

    if (data.user) {
      console.log('✅ Login realizado com sucesso!');
      console.log('📧 Email:', data.user.email);
      console.log('🆔 ID:', data.user.id);
      console.log('📝 User Metadata:', JSON.stringify(data.user.user_metadata, null, 2));
      
      // Verificar dados na tabela usuarios
      const { createClient: createServiceClient } = require('@supabase/supabase-js');
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseServiceKey) {
        const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey);
        
        const { data: usuarioData, error: usuarioError } = await supabaseAdmin
          .from('usuarios')
          .select('*')
          .eq('auth_user_id', data.user.id)
          .single();

        if (usuarioError) {
          console.error('❌ Erro ao buscar dados na tabela usuarios:', usuarioError.message);
        } else {
          console.log('\n📊 Dados na tabela usuarios:');
          console.log('👤 Nome:', usuarioData.nome);
          console.log('📧 Email:', usuarioData.email);
          console.log('🔑 Permissão:', usuarioData.permissao);
          console.log('🔑 Role (legacy):', usuarioData.role);
          console.log('📍 Regional:', usuarioData.regional);
          console.log('📋 Status:', usuarioData.status);
        }
      }

      // Fazer logout
      await supabase.auth.signOut();
      console.log('\n✅ Logout realizado com sucesso');
    }
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testLogin();