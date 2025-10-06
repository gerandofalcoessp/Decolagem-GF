import { createClient } from '@supabase/supabase-js';

async function setupAdminRLS() {
  try {
    console.log('🔧 Configurando políticas RLS para admin/super_admin...');
    
    const supabase = createClient(
      'https://ldfldwfvspclsnpgjgmv.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE'
    );

    // Primeiro, vamos verificar como está estruturada a tabela members para entender o campo role
    console.log('\n🔍 Verificando estrutura da tabela members...');
    const { data: membersData, error: membersError } = await supabase
      .from('members')
      .select('*')
      .limit(10);
    
    if (membersError) {
      console.log('❌ Erro ao buscar members:', membersError.message);
    } else {
      console.log('📊 Estrutura dos members:');
      if (membersData && membersData.length > 0) {
        console.log('Campos disponíveis:', Object.keys(membersData[0]));
        console.log('Primeiro registro completo:', membersData[0]);
      }
    }

    // Verificar se existe algum usuário com role admin ou super_admin
    console.log('\n🔍 Procurando usuários admin/super_admin...');
    
    // Tentar diferentes possíveis nomes de campos para role
    const possibleRoleFields = ['role', 'user_role', 'member_role', 'type', 'user_type'];
    
    for (const roleField of possibleRoleFields) {
      try {
        const { data: adminUsers, error } = await supabase
          .from('members')
          .select('*')
          .or(`${roleField}.eq.admin,${roleField}.eq.super_admin`);
        
        if (!error && adminUsers && adminUsers.length > 0) {
          console.log(`✅ Encontrados usuários admin usando campo '${roleField}':`, adminUsers.length);
          adminUsers.forEach(user => {
            console.log(`- ${user.name} (${user.email}) - ${roleField}: ${user[roleField]}`);
          });
          break;
        }
      } catch (err) {
        // Campo não existe, continuar tentando
      }
    }

    // Verificar tabela usuarios também
    console.log('\n🔍 Verificando tabela usuarios...');
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(5);
    
    if (!usuariosError && usuariosData) {
      console.log('📊 Estrutura da tabela usuarios:');
      if (usuariosData.length > 0) {
        console.log('Campos disponíveis:', Object.keys(usuariosData[0]));
        console.log('Primeiro registro:', usuariosData[0]);
      }
    }

    console.log('\n✅ Análise de estrutura concluída!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Identificar o campo correto para roles');
    console.log('2. Criar políticas RLS para cada tabela');
    console.log('3. Testar acesso com usuários admin');
    
  } catch (error) {
    console.error('❌ Erro na configuração:', error.message);
  }
}

setupAdminRLS();