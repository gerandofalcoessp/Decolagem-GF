import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMigrationStatus() {
  console.log('🔍 Verificando status da migração da tabela calendar_events...\n');
  
  try {
    // 1. Verificar se a tabela calendar_events existe
    console.log('1. Verificando se a tabela calendar_events existe...');
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'calendar_events'
      );
    `;
    
    const { data: tableExists, error: tableError } = await supabaseAdmin.rpc('exec_sql', { sql: checkTableQuery });
    
    if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError.message);
      return;
    }
    
    console.log('✅ Tabela calendar_events existe');
    
    // 2. Verificar estrutura da tabela
    console.log('\n2. Verificando estrutura da tabela calendar_events...');
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'calendar_events' 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const { data: structure, error: structureError } = await supabaseAdmin.rpc('exec_sql', { sql: structureQuery });
    
    if (structureError) {
      console.error('❌ Erro ao verificar estrutura:', structureError.message);
      return;
    }
    
    console.log('✅ Estrutura da tabela verificada');
    
    // 3. Verificar se a coluna status existe especificamente
    console.log('\n3. Verificando coluna status...');
    const statusColumnQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'calendar_events' 
        AND table_schema = 'public'
        AND column_name = 'status';
    `;
    
    const { data: statusColumn, error: statusError } = await supabaseAdmin.rpc('exec_sql', { sql: statusColumnQuery });
    
    if (statusError) {
      console.error('❌ Erro ao verificar coluna status:', statusError.message);
      return;
    }
    
    if (statusColumn && statusColumn.length > 0) {
      console.log('✅ Coluna status encontrada');
    } else {
      console.log('❌ Coluna status NÃO encontrada - migração incompleta');
      
      // 4. Tentar adicionar a coluna status se não existir
      console.log('\n4. Tentando adicionar coluna status...');
      const addStatusQuery = `
        ALTER TABLE calendar_events 
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo';
      `;
      
      const { error: addError } = await supabaseAdmin.rpc('exec_sql', { sql: addStatusQuery });
      
      if (addError) {
        console.error('❌ Erro ao adicionar coluna status:', addError.message);
      } else {
        console.log('✅ Coluna status adicionada com sucesso');
      }
    }
    
    // 5. Testar inserção de um evento simples
    console.log('\n5. Testando inserção de evento...');
    const testEventData = {
      titulo: 'Teste Migração',
      descricao: 'Teste após verificação da migração',
      data_inicio: '2025-01-25T10:00:00',
      regional: 'SP',
      status: 'ativo'
    };

    const { data: newEvent, error: insertError } = await supabaseAdmin
      .from('calendar_events')
      .insert([testEventData])
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir evento de teste:', insertError.message);
      console.error('Código:', insertError.code);
    } else {
      console.log('✅ Evento de teste inserido com sucesso!');
      console.log('ID do evento:', newEvent[0]?.id);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkMigrationStatus();