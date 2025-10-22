import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// Carregar variáveis de ambiente
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);
async function checkMemberDuplicates() {
    try {
        console.log('🔍 Verificando duplicatas na tabela members...\n');
        // Buscar todos os membros
        const { data: members, error } = await supabase
            .from('members')
            .select('*')
            .order('created_at', { ascending: true });
        if (error) {
            console.error('❌ Erro ao buscar membros:', error.message);
            return;
        }
        console.log(`📊 Total de membros encontrados: ${members.length}\n`);
        // Verificar duplicatas por email
        const emailGroups = members.reduce((acc, member) => {
            if (!acc[member.email]) {
                acc[member.email] = [];
            }
            acc[member.email].push(member);
            return acc;
        }, {});
        const duplicateEmails = Object.entries(emailGroups).filter(([_, members]) => members.length > 1);
        if (duplicateEmails.length > 0) {
            console.log('⚠️  Duplicatas encontradas por email:');
            duplicateEmails.forEach(([email, members]) => {
                console.log(`\n📧 Email: ${email}`);
                members.forEach((member, index) => {
                    console.log(`  ${index + 1}. ID: ${member.id} | Nome: ${member.name} | Criado: ${new Date(member.created_at).toLocaleString()}`);
                });
            });
        }
        else {
            console.log('✅ Nenhuma duplicata por email encontrada');
        }
        // Verificar duplicatas por auth_user_id (excluindo nulls)
        const authUserGroups = members
            .filter(member => member.auth_user_id)
            .reduce((acc, member) => {
            if (!acc[member.auth_user_id]) {
                acc[member.auth_user_id] = [];
            }
            acc[member.auth_user_id].push(member);
            return acc;
        }, {});
        const duplicateAuthUsers = Object.entries(authUserGroups).filter(([_, members]) => members.length > 1);
        if (duplicateAuthUsers.length > 0) {
            console.log('\n⚠️  Duplicatas encontradas por auth_user_id:');
            duplicateAuthUsers.forEach(([authUserId, members]) => {
                console.log(`\n🔑 Auth User ID: ${authUserId}`);
                members.forEach((member, index) => {
                    console.log(`  ${index + 1}. ID: ${member.id} | Nome: ${member.name} | Email: ${member.email} | Criado: ${new Date(member.created_at).toLocaleString()}`);
                });
            });
        }
        else {
            console.log('✅ Nenhuma duplicata por auth_user_id encontrada');
        }
        // Verificar membros sem auth_user_id
        const membersWithoutAuth = members.filter(member => !member.auth_user_id);
        if (membersWithoutAuth.length > 0) {
            console.log(`\n📋 Membros sem auth_user_id: ${membersWithoutAuth.length}`);
            membersWithoutAuth.forEach((member) => {
                console.log(`  - ID: ${member.id} | Nome: ${member.name} | Email: ${member.email}`);
            });
        }
    }
    catch (error) {
        console.error('❌ Erro:', error);
    }
}
// Executar diretamente
checkMemberDuplicates();
