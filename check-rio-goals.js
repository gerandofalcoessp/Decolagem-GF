const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRioGoals() {
  try {
    console.log('🔍 Verificando metas para a regional Rio de Janeiro...\n');
    
    // 1. Verificar todas as metas no sistema
    console.log('1️⃣ Verificando todas as metas no sistema:');
    const { data: allGoals, error: allGoalsError } = await supabaseAdmin
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allGoalsError) {
      console.error('❌ Erro ao buscar metas:', allGoalsError);
      return;
    }
    
    console.log(`📊 Total de metas no sistema: ${allGoals.length}`);
    
    if (allGoals.length > 0) {
      console.log('\n📋 Primeiras 5 metas:');
      allGoals.slice(0, 5).forEach((meta, index) => {
        console.log(`${index + 1}. ${meta.nome}`);
        console.log(`   - Descrição: ${meta.descricao}`);
        console.log(`   - Member ID: ${meta.member_id}`);
        console.log(`   - Created by: ${meta.created_by}`);
        console.log(`   - Valor Meta: ${meta.valor_meta}`);
        console.log(`   - Valor Atual: ${meta.valor_atual}`);
        console.log('');
      });
      
      // Analisar distribuição por descrição
      const metasPorDescricao = {};
      allGoals.forEach(meta => {
        const descricao = meta.descricao || 'Sem descrição';
        metasPorDescricao[descricao] = (metasPorDescricao[descricao] || 0) + 1;
      });
      
      console.log('\n📈 Metas por descrição:');
      Object.entries(metasPorDescricao).forEach(([descricao, count]) => {
        console.log(`  - ${descricao}: ${count} metas`);
      });
    }
    
    // 2. Buscar metas relacionadas ao Rio de Janeiro
    console.log('\n2️⃣ Buscando metas relacionadas ao Rio de Janeiro:');
    const { data: rioGoals, error: rioGoalsError } = await supabaseAdmin
      .from('goals')
      .select('*')
      .or('descricao.ilike.%rio%,descricao.ilike.%rj%');
    
    if (rioGoalsError) {
      console.error('❌ Erro ao buscar metas do Rio:', rioGoalsError);
    } else {
      console.log(`📊 Metas relacionadas ao Rio: ${rioGoals.length}`);
      
      if (rioGoals.length > 0) {
        rioGoals.forEach((meta, index) => {
          console.log(`${index + 1}. ${meta.nome}`);
          console.log(`   - Descrição: ${meta.descricao}`);
          console.log(`   - Member ID: ${meta.member_id}`);
          console.log(`   - Created by: ${meta.created_by}`);
          console.log('');
        });
      }
    }
    
    // 3. Verificar quem criou as metas (member_id)
    console.log('\n3️⃣ Verificando criadores das metas:');
    const memberIds = [...new Set(allGoals.map(meta => meta.member_id).filter(Boolean))];
    
    console.log(`📊 Diferentes criadores de metas: ${memberIds.length}`);
    
    for (const memberId of memberIds.slice(0, 10)) { // Limitar a 10 para não sobrecarregar
      const { data: member, error: memberError } = await supabaseAdmin
        .from('members')
        .select('id, name, nome, email, regional, area, auth_user_id')
        .eq('id', memberId)
        .single();
      
      if (!memberError && member) {
        console.log(`👤 Member ID ${memberId}:`);
        console.log(`   - Nome: ${member.name || member.nome}`);
        console.log(`   - Email: ${member.email}`);
        console.log(`   - Regional: ${member.regional || 'N/A'}`);
        console.log(`   - Área: ${member.area || 'N/A'}`);
        
        // Verificar quantas metas este member criou
        const metasDoMember = allGoals.filter(meta => meta.member_id === memberId);
        console.log(`   - Metas criadas: ${metasDoMember.length}`);
        
        // Se for do Rio, mostrar as metas
        if (member.regional && (member.regional.toLowerCase().includes('rio') || member.regional.toLowerCase().includes('rj'))) {
          console.log(`   🎯 MEMBER DO RIO DE JANEIRO!`);
          if (metasDoMember.length > 0) {
            console.log(`   📋 Suas metas:`);
            metasDoMember.forEach((meta, index) => {
              console.log(`      ${index + 1}. ${meta.nome} (${meta.descricao})`);
            });
          }
        }
        console.log('');
      }
    }
    
    // 4. Verificar se Flávia Silva tem member_id
    console.log('\n4️⃣ Verificando se Flávia Silva tem member_id:');
    const { data: flaviaMembers, error: flaviaMembersError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('auth_user_id', '5eedfafe-fb84-4871-83f2-1dcd5be3f283'); // ID do auth da Flávia
    
    if (flaviaMembersError) {
      console.error('❌ Erro ao buscar member da Flávia:', flaviaMembersError);
    } else {
      console.log(`📊 Members encontrados para Flávia: ${flaviaMembers.length}`);
      
      if (flaviaMembers.length > 0) {
        flaviaMembers.forEach((member, index) => {
          console.log(`${index + 1}. Member ID: ${member.id}`);
          console.log(`   - Nome: ${member.name || member.nome}`);
          console.log(`   - Email: ${member.email}`);
          console.log(`   - Regional: ${member.regional}`);
          console.log(`   - Área: ${member.area}`);
          
          // Verificar se tem metas
          const metasDaFlavia = allGoals.filter(meta => meta.member_id === member.id);
          console.log(`   - Metas próprias: ${metasDaFlavia.length}`);
          console.log('');
        });
      } else {
        console.log('❌ Flávia Silva não tem registro na tabela members!');
        console.log('💡 Isso explica por que ela não vê metas - ela precisa de um member_id');
      }
    }
    
    // 5. Verificar super admins e suas metas
    console.log('\n5️⃣ Verificando super admins e suas metas:');
    const { data: superAdminMembers, error: superAdminError } = await supabaseAdmin
      .from('members')
      .select('*')
      .not('auth_user_id', 'is', null);
    
    if (!superAdminError && superAdminMembers.length > 0) {
      console.log('🔍 Verificando quais members são super admins...');
      
      for (const member of superAdminMembers.slice(0, 5)) { // Limitar para não sobrecarregar
        try {
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(member.auth_user_id);
          
          if (!userError && userData.user?.user_metadata?.role === 'super_admin') {
            console.log(`👑 Super Admin: ${member.name || member.nome} (ID: ${member.id})`);
            
            const metasDoSuperAdmin = allGoals.filter(meta => meta.member_id === member.id);
            console.log(`   - Metas criadas: ${metasDoSuperAdmin.length}`);
            
            if (metasDoSuperAdmin.length > 0) {
              console.log(`   📋 Suas metas:`);
              metasDoSuperAdmin.slice(0, 3).forEach((meta, index) => {
                console.log(`      ${index + 1}. ${meta.nome} (${meta.descricao})`);
              });
            }
            console.log('');
          }
        } catch (error) {
          // Ignorar erros individuais
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkRioGoals();