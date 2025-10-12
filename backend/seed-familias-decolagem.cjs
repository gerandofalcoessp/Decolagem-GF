const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedFamiliasDecolagem() {
  try {
    console.log('🌱 Inserindo dados de exemplo para famílias Decolagem...\n');
    
    // Primeiro, vamos buscar alguns members existentes
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id')
      .limit(10);

    if (membersError) {
      console.error('❌ Erro ao buscar members:', membersError.message);
      return;
    }

    if (!members || members.length === 0) {
      console.log('❌ Nenhum member encontrado. Criando um member de exemplo...');
      
      // Criar um member de exemplo
      const { data: newMember, error: createError } = await supabase
        .from('members')
        .insert({
          auth_user_id: '00000000-0000-0000-0000-000000000001', // UUID fictício
          name: 'Usuário Exemplo',
          email: 'exemplo@decolagem.com'
        })
        .select('id')
        .single();

      if (createError) {
        console.error('❌ Erro ao criar member:', createError.message);
        return;
      }

      members.push(newMember);
    }

    console.log(`📊 Encontrados ${members.length} members disponíveis`);

    // Dados de exemplo para famílias
    const familiasExemplo = [
      {
        member_id: members[0].id,
        nome_responsavel: 'Maria Silva Santos',
        numero_membros: 4,
        renda_familiar: 2500.00,
        endereco: 'Rua das Flores, 123 - Centro',
        telefone: '(11) 98765-4321',
        status: 'ativo'
      },
      {
        member_id: members[0].id,
        nome_responsavel: 'João Oliveira Costa',
        numero_membros: 3,
        renda_familiar: 1800.00,
        endereco: 'Av. Principal, 456 - Jardim América',
        telefone: '(11) 97654-3210',
        status: 'ativo'
      },
      {
        member_id: members[0].id,
        nome_responsavel: 'Ana Paula Ferreira',
        numero_membros: 5,
        renda_familiar: 3200.00,
        endereco: 'Rua do Comércio, 789 - Vila Nova',
        telefone: '(11) 96543-2109',
        status: 'ativo'
      },
      {
        member_id: members[0].id,
        nome_responsavel: 'Carlos Eduardo Lima',
        numero_membros: 2,
        renda_familiar: 1500.00,
        endereco: 'Travessa da Paz, 321 - Bairro Alto',
        telefone: '(11) 95432-1098',
        status: 'ativo'
      },
      {
        member_id: members[0].id,
        nome_responsavel: 'Fernanda Rodrigues',
        numero_membros: 6,
        renda_familiar: 2800.00,
        endereco: 'Rua Nova Esperança, 654 - Periferia',
        telefone: '(11) 94321-0987',
        status: 'ativo'
      }
    ];

    // Inserir as famílias
    const { data: insertedFamilias, error: insertError } = await supabase
      .from('familias_decolagem')
      .insert(familiasExemplo)
      .select('*');

    if (insertError) {
      console.error('❌ Erro ao inserir famílias:', insertError.message);
      return;
    }

    console.log(`✅ ${insertedFamilias.length} famílias inseridas com sucesso!`);
    
    // Mostrar resumo
    console.log('\n📋 Resumo das famílias inseridas:');
    insertedFamilias.forEach((familia, index) => {
      console.log(`  ${index + 1}. ${familia.nome_responsavel} - ${familia.numero_membros} membros - R$ ${familia.renda_familiar}`);
    });

    // Verificar total
    const { count, error: countError } = await supabase
      .from('familias_decolagem')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo');

    if (!countError) {
      console.log(`\n🎯 Total de famílias ativas no Decolagem: ${count}`);
    }

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

seedFamiliasDecolagem();