const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserPermissions() {
  console.log('🔧 Corrigindo dados do usuário lemaestro@gerandofalcoes.com...\n');

  try {
    // 1. Primeiro, vamos tentar atualizar diretamente o usuário
    console.log('1. Atualizando usuário lemaestro@gerandofalcoes.com diretamente:');
    
    // Tentar atualizar com permissao
    const { data: updateResult1, error: updateError1 } = await supabase
      .from('usuarios')
      .update({ permissao: 'super_admin' })
      .eq('email', 'lemaestro@gerandofalcoes.com');

    if (updateError1) {
      console.log('⚠️ Erro ao atualizar campo permissao (pode não existir):', updateError1.message);
    } else {
      console.log('✅ Campo permissao atualizado com sucesso');
    }

    // Tentar atualizar com role
    const { data: updateResult2, error: updateError2 } = await supabase
      .from('usuarios')
      .update({ role: 'super_admin' })
      .eq('email', 'lemaestro@gerandofalcoes.com');

    if (updateError2) {
      console.log('⚠️ Erro ao atualizar campo role:', updateError2.message);
    } else {
      console.log('✅ Campo role atualizado com sucesso');
    }

    // 2. Verificar se existe coluna permissao e role
    const hasPermissaoColumn = !updateError1;
    const hasRoleColumn = !updateError2;

    console.log(`\n📊 Análise de colunas:`);
    console.log(`- Coluna 'permissao' existe: ${hasPermissaoColumn ? '✅' : '❌'}`);
    console.log(`- Coluna 'role' existe: ${hasRoleColumn ? '✅' : '❌'}`);

    // 3. Se não existe coluna permissao, criar
    if (!hasPermissaoColumn) {
      console.log('\n3. Criando coluna permissao:');
      const { data: addColumnResult, error: addColumnError } = await supabase
        .rpc('exec_sql', {
          sql: `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permissao VARCHAR(50);`
        });

      if (addColumnError) {
        console.error('❌ Erro ao criar coluna permissao:', addColumnError);
      } else {
        console.log('✅ Coluna permissao criada com sucesso');
      }
    }

    // 4. Migrar dados de role para permissao se necessário
    if (hasRoleColumn) {
      console.log('\n4. Migrando dados de role para permissao:');
      const { data: migrateResult, error: migrateError } = await supabase
        .rpc('exec_sql', {
          sql: `
            UPDATE usuarios 
            SET permissao = CASE 
              WHEN role = 'Super Admin' THEN 'super_admin'
              WHEN role = 'Admin' THEN 'admin'
              WHEN role = 'Usuário' THEN 'user'
              ELSE LOWER(REPLACE(role, ' ', '_'))
            END
            WHERE permissao IS NULL OR permissao = '';
          `
        });

      if (migrateError) {
        console.error('❌ Erro ao migrar dados:', migrateError);
      } else {
        console.log('✅ Dados migrados com sucesso');
        console.log(`📊 Linhas afetadas: ${migrateResult ? migrateResult.length : 'N/A'}`);
      }
    }

    // 5. Verificar resultado final
    console.log('\n5. Verificando resultado final:');
    const { data: finalCheck, error: finalError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'lemaestro@gerandofalcoes.com');

    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError);
    } else {
      console.log('✅ Dados finais do usuário:');
      console.log(JSON.stringify(finalCheck, null, 2));
    }

    // 6. Verificar todos os usuários com permissao super_admin
    console.log('\n6. Verificando todos os super admins:');
    const { data: superAdmins, error: superAdminsError } = await supabase
      .from('usuarios')
      .select('email, permissao, role')
      .or('permissao.eq.super_admin,role.eq.super_admin,role.eq.Super Admin');

    if (superAdminsError) {
      console.error('❌ Erro ao verificar super admins:', superAdminsError);
    } else {
      console.log('✅ Super admins encontrados:');
      console.log(JSON.stringify(superAdmins, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixUserPermissions();