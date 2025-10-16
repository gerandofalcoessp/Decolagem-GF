const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function getValidMember() {
  console.log('🔍 Buscando um member_id válido...');
  
  // Buscar um membro válido
  const { data: members, error } = await supabase
    .from('members')
    .select('id, name, email')
    .limit(1);

  if (error) {
    console.error('❌ Erro ao buscar membros:', error);
  } else if (members && members.length > 0) {
    const member = members[0];
    console.log('✅ Membro encontrado:');
    console.log('  ID:', member.id);
    console.log('  Nome:', member.name);
    console.log('  Email:', member.email);
    
    // Agora testar o salvamento com um member_id válido
    const npsNacionalData = {
      title: 'NPS Nacional - Teste',
      description: 'Teste de atividade NPS nacional para verificar se aparece em todas as atividades',
      type: 'nps',
      activity_date: new Date().toISOString().split('T')[0],
      regional: 'nacional',
      programa: JSON.stringify(['lideranca']),
      estados: JSON.stringify(['Todos os Estados']),
      quantidade: 90,
      atividade_label: 'NPS',
      regionais_nps: JSON.stringify(['nacional']),
      member_id: member.id,
      evidences: JSON.stringify([])
    };

    console.log('\n📝 Inserindo atividade NPS nacional...');

    const { data, error: insertError } = await supabase
      .from('regional_activities')
      .insert(npsNacionalData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir atividade NPS nacional:', insertError);
    } else {
      console.log('✅ Atividade NPS nacional inserida com sucesso!');
      console.log('  ID da atividade:', data.id);
      console.log('  Título:', data.title);
      console.log('  Regional:', data.regional);
      console.log('  Tipo:', data.type);
      
      // Verificar se agora existem atividades NPS nacionais
      const { data: nacionais, error: nacionalError } = await supabase
        .from('regional_activities')
        .select('*')
        .eq('type', 'nps')
        .eq('regional', 'nacional')
        .order('created_at', { ascending: false });
        
      if (nacionalError) {
        console.error('❌ Erro ao verificar atividades nacionais:', nacionalError);
      } else {
        console.log('\n📊 Total de atividades NPS nacionais:', nacionais.length);
      }
    }
  } else {
    console.log('❌ Nenhum membro encontrado na tabela members');
  }
}

getValidMember().catch(console.error);