import 'dotenv/config';
import { AuthService } from '../services/authService.js'
import { supabaseAdmin } from '../services/supabaseClient.js'

async function testRegisterValidation() {
  console.log('🔍 Testando validação de super admin na rota de registro...\n');

  try {
    // 1. Buscar um super admin existente
    console.log('1. Buscando super admin existente...');
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    const superAdmins = users.users.filter(user => 
      user.user_metadata?.role === 'super_admin'
    );

    if (superAdmins.length === 0) {
      console.log('❌ Nenhum super admin encontrado');
      return;
    }

    const superAdmin = superAdmins[0];
    console.log(`✅ Super admin encontrado: ${superAdmin.email} (ID: ${superAdmin.id})`);

    // 2. Testar getMemberData para este super admin
    console.log('\n2. Testando AuthService.getMemberData...');
    const memberData = await AuthService.getMemberData(superAdmin.id);
    
    console.log('Dados do membro retornados:', JSON.stringify(memberData, null, 2));

    if (!memberData) {
      console.log('❌ getMemberData retornou null');
      return;
    }

    if (memberData.role !== 'super_admin') {
      console.log(`❌ Role incorreto: esperado 'super_admin', recebido '${memberData.role}'`);
      return;
    }

    console.log('✅ getMemberData funcionando corretamente');

    // 3. Verificar se existe entrada na tabela members
    console.log('\n3. Verificando entrada na tabela members...');
    const { data: memberRecord, error: memberError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('user_id', superAdmin.id)
      .single();

    if (memberError) {
      console.log('❌ Erro ao buscar na tabela members:', memberError);
      console.log('⚠️  Possível problema: super admin não tem entrada na tabela members');
    } else {
      console.log('✅ Entrada na tabela members encontrada:', JSON.stringify(memberRecord, null, 2));
    }

    // 4. Testar a função is_super_admin diretamente
    console.log('\n4. Testando função is_super_admin...');
    const { data: isSuperAdminResult, error: functionError } = await supabaseAdmin
      .rpc('is_super_admin', { user_uuid: superAdmin.id });

    if (functionError) {
      console.log('❌ Erro ao executar is_super_admin:', functionError);
    } else {
      console.log(`✅ is_super_admin retornou: ${isSuperAdminResult}`);
    }

    // 5. Verificar user_metadata
    console.log('\n5. Verificando user_metadata...');
    console.log('User metadata:', JSON.stringify(superAdmin.user_metadata, null, 2));

    // 6. Simular a validação da rota
    console.log('\n6. Simulando validação da rota de registro...');
    const routeValidation = memberData && memberData.role === 'super_admin';
    console.log(`Validação da rota: ${routeValidation ? '✅ PASSOU' : '❌ FALHOU'}`);

    if (!routeValidation) {
      console.log('\n🔍 Análise do problema:');
      console.log(`- memberData existe: ${!!memberData}`);
      console.log(`- memberData.role: ${memberData?.role}`);
      console.log(`- Comparação role === 'super_admin': ${memberData?.role === 'super_admin'}`);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testRegisterValidation().catch(console.error);