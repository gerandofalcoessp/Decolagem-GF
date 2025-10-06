import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugMemberUpdate() {
  console.log('🔍 Debugando atualização de membros...\n');

  try {
    // 1. Listar todos os membros
    console.log('1. Listando todos os membros:');
    const { data: allMembers, error: listError } = await supabaseAdmin
      .from('members')
      .select('*')
      .limit(5);

    if (listError) {
      console.error('❌ Erro ao listar membros:', listError.message);
      return;
    }

    console.log(`✅ Encontrados ${allMembers?.length || 0} membros`);
    if (allMembers && allMembers.length > 0) {
      console.log('Primeiro membro:', {
        id: allMembers[0].id,
        name: allMembers[0].name,
        email: allMembers[0].email,
        funcao: allMembers[0].funcao
      });

      const testMemberId = allMembers[0].id;
      const originalName = allMembers[0].name;

      console.log(`\n2. Testando atualização do membro ${testMemberId}:`);

      // 2. Testar atualização simples
      const testPayload = {
        name: `${originalName} - TESTE ${Date.now()}`
      };

      console.log('Payload de teste:', testPayload);

      const { data: updateResult, error: updateError } = await supabaseAdmin
        .from('members')
        .update(testPayload)
        .eq('id', testMemberId)
        .select('*');

      if (updateError) {
        console.error('❌ Erro na atualização:', updateError.message);
        return;
      }

      console.log('✅ Resultado da atualização:');
      console.log('- Dados retornados:', updateResult);
      console.log('- Quantidade de registros:', updateResult?.length || 0);

      if (updateResult && updateResult.length > 0) {
        console.log('- Membro atualizado:', {
          id: updateResult[0].id,
          name: updateResult[0].name,
          email: updateResult[0].email
        });

        // 3. Reverter a alteração
        console.log('\n3. Revertendo alteração...');
        const { data: revertResult, error: revertError } = await supabaseAdmin
          .from('members')
          .update({ name: originalName })
          .eq('id', testMemberId)
          .select('*');

        if (revertError) {
          console.error('❌ Erro ao reverter:', revertError.message);
        } else {
          console.log('✅ Alteração revertida com sucesso');
        }
      }

      // 4. Testar com RLS habilitado (simulando usuário autenticado)
      console.log('\n4. Testando com contexto de usuário autenticado...');
      
      // Buscar um usuário admin
      const { data: adminUsers, error: adminError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (adminError) {
        console.error('❌ Erro ao buscar usuários:', adminError.message);
        return;
      }

      const adminUser = adminUsers.users.find(u => u.email?.includes('admin') || u.email?.includes('flavio'));
      
      if (adminUser) {
        console.log('Usuário admin encontrado:', adminUser.email);
        
        // Criar cliente com contexto de usuário
        const userClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

        // Simular sessão do usuário
        await userClient.auth.setSession({
          access_token: 'fake-token',
          refresh_token: 'fake-refresh'
        });

        const testPayload2 = {
          name: `${originalName} - TESTE RLS ${Date.now()}`
        };

        const { data: rlsResult, error: rlsError } = await userClient
          .from('members')
          .update(testPayload2)
          .eq('id', testMemberId)
          .select('*');

        console.log('Resultado com RLS:');
        console.log('- Erro:', rlsError?.message || 'Nenhum');
        console.log('- Dados:', rlsResult);
        console.log('- Quantidade:', rlsResult?.length || 0);
      }

    } else {
      console.log('❌ Nenhum membro encontrado para teste');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugMemberUpdate();