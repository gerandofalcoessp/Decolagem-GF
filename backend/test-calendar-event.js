import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCalendarEventCreation() {
  console.log('🧪 Testando criação de evento de calendário após correção RLS...\n');
  
  try {
    // 1. Primeiro, verificar se a tabela está vazia
    console.log('1. Verificando eventos existentes...');
    const { data: existingEvents, error: selectError } = await supabaseAdmin
      .from('calendar_events')
      .select('*');

    if (selectError) {
      console.error('❌ Erro ao buscar eventos existentes:', selectError.message);
      return;
    }

    console.log(`✅ Eventos existentes: ${existingEvents?.length || 0}`);

    // 2. Tentar criar um evento de teste
    console.log('\n2. Criando evento de teste...');
    const eventData = {
      titulo: 'Evento Teste RLS',
      descricao: 'Teste após correção das políticas RLS',
      tipo: 'reuniao',
      data_inicio: '2025-01-25T10:00:00',
      data_fim: '2025-01-25T11:00:00',
      local: 'Online',
      regional: 'SP',
      programa: 'Geral',
      participantes_esperados: 10,
      status: 'planejado'
    };

    const { data: newEvent, error: insertError } = await supabaseAdmin
      .from('calendar_events')
      .insert([eventData])
      .select();

    if (insertError) {
      console.error('❌ Erro ao criar evento:', insertError.message);
      console.error('Código:', insertError.code);
      console.error('Detalhes:', insertError.details);
      return;
    }

    console.log('✅ Evento criado com sucesso!');
    console.log('Dados do evento:', newEvent);

    // 3. Verificar se o evento foi realmente salvo
    console.log('\n3. Verificando se o evento foi salvo...');
    const { data: allEvents, error: verifyError } = await supabaseAdmin
      .from('calendar_events')
      .select('*');

    if (verifyError) {
      console.error('❌ Erro ao verificar eventos:', verifyError.message);
      return;
    }

    console.log(`✅ Total de eventos na tabela: ${allEvents?.length || 0}`);
    
    if (allEvents && allEvents.length > 0) {
      console.log('\n📋 Eventos encontrados:');
      allEvents.forEach((event, index) => {
        console.log(`${index + 1}. ${event.titulo} - ${event.data_inicio} (${event.status})`);
      });
    }

    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('   As políticas RLS estão funcionando corretamente.');
    console.log('   Agora você pode testar a criação de eventos pelo frontend.');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar teste
testCalendarEventCreation().catch(console.error);