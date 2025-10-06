const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function restoreNorteEvent() {
  try {
    console.log('🔄 Restaurando evento da regional Norte...');
    
    // Primeiro, verificar se já existe algum evento
    const { data: existingEvents, error: checkError } = await supabase
      .from('calendar_events')
      .select('*');
    
    if (checkError) {
      console.error('❌ Erro ao verificar eventos existentes:', checkError);
      return;
    }
    
    console.log(`📊 Eventos existentes: ${existingEvents.length}`);
    
    // Buscar um usuário da regional Norte para ser o responsável
    const { data: norteUsers, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('regional', '%norte%')
      .limit(1);
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário da regional Norte:', userError);
      return;
    }
    
    if (!norteUsers || norteUsers.length === 0) {
      console.log('❌ Nenhum usuário da regional Norte encontrado');
      return;
    }
    
    const norteUser = norteUsers[0];
    console.log(`👤 Usuário responsável: ${norteUser.nome} (${norteUser.email})`);
    console.log(`🏢 Regional do usuário: ${norteUser.regional}`);
    
    // Criar o evento restaurado
    const eventData = {
      id: 'd07020ae-a6e9-426f-a0f6-02350518aca4', // Mesmo ID do evento original
      titulo: 'formacao_ligas',
      descricao: 'dddd22',
      data_inicio: '2025-10-20T10:35:00+00:00',
      data_fim: '2025-10-20T11:35:00+00:00',
      regional: 'norte', // Regional normalizada
      responsavel_id: norteUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📅 Criando evento:');
    console.log('- Título:', eventData.titulo);
    console.log('- Regional:', eventData.regional);
    console.log('- Data:', eventData.data_inicio);
    console.log('- Responsável:', norteUser.nome);
    
    const { data: newEvent, error: createError } = await supabase
      .from('calendar_events')
      .insert([eventData])
      .select('*')
      .single();
    
    if (createError) {
      console.error('❌ Erro ao criar evento:', createError);
      return;
    }
    
    console.log('✅ Evento restaurado com sucesso!');
    console.log('- ID:', newEvent.id);
    console.log('- Título:', newEvent.titulo);
    console.log('- Regional:', newEvent.regional);
    
    // Verificar total de eventos
    const { data: allEvents, error: countError } = await supabase
      .from('calendar_events')
      .select('id, titulo, regional')
      .order('created_at', { ascending: false });
    
    if (countError) {
      console.error('❌ Erro ao verificar eventos:', countError);
      return;
    }
    
    console.log(`\n📊 Total de eventos no banco: ${allEvents.length}`);
    allEvents.forEach((evt, index) => {
      console.log(`${index + 1}. ${evt.titulo} (Regional: ${evt.regional})`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

restoreNorteEvent();