import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyCalendarEventsMigration() {
  console.log('🚀 Aplicando migração completa da tabela calendar_events...\n');
  
  try {
    // 1. Primeiro, verificar se a tabela já existe
    console.log('1. Verificando se a tabela calendar_events já existe...');
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
    
    // 2. Dropar a tabela se existir (para recriar com estrutura correta)
    console.log('2. Removendo tabela existente para recriar...');
    const dropTableQuery = `DROP TABLE IF EXISTS calendar_events CASCADE;`;
    
    const { error: dropError } = await supabaseAdmin.rpc('exec_sql', { sql: dropTableQuery });
    
    if (dropError) {
      console.error('❌ Erro ao remover tabela:', dropError.message);
      return;
    }
    
    console.log('✅ Tabela removida com sucesso');
    
    // 3. Criar a tabela com a estrutura completa
    console.log('3. Criando tabela calendar_events com estrutura completa...');
    const createTableQuery = `
      CREATE TABLE calendar_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        tipo VARCHAR(100),
        data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
        data_fim TIMESTAMP WITH TIME ZONE,
        local VARCHAR(255),
        regional VARCHAR(50),
        programa VARCHAR(50),
        responsavel_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
        participantes_esperados INTEGER,
        participantes_confirmados INTEGER DEFAULT 0,
        quantidade INTEGER,
        evidencias JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(20) DEFAULT 'ativo',
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', { sql: createTableQuery });
    
    if (createError) {
      console.error('❌ Erro ao criar tabela:', createError.message);
      return;
    }
    
    console.log('✅ Tabela calendar_events criada com sucesso');
    
    // 4. Criar índices para performance
    console.log('4. Criando índices...');
    const indexQueries = [
      'CREATE INDEX idx_calendar_events_responsavel_id ON calendar_events(responsavel_id);',
      'CREATE INDEX idx_calendar_events_data_inicio ON calendar_events(data_inicio);',
      'CREATE INDEX idx_calendar_events_regional ON calendar_events(regional);',
      'CREATE INDEX idx_calendar_events_programa ON calendar_events(programa);',
      'CREATE INDEX idx_calendar_events_tipo ON calendar_events(tipo);'
    ];
    
    for (const indexQuery of indexQueries) {
      const { error: indexError } = await supabaseAdmin.rpc('exec_sql', { sql: indexQuery });
      if (indexError) {
        console.log(`⚠️ Aviso ao criar índice: ${indexError.message}`);
      }
    }
    
    console.log('✅ Índices criados');
    
    // 5. Habilitar RLS
    console.log('5. Habilitando RLS...');
    const enableRLSQuery = 'ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;';
    
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', { sql: enableRLSQuery });
    
    if (rlsError) {
      console.error('❌ Erro ao habilitar RLS:', rlsError.message);
    } else {
      console.log('✅ RLS habilitado');
    }
    
    // 6. Criar políticas RLS
    console.log('6. Criando políticas RLS...');
    const policies = [
      {
        name: 'calendar_events_select_policy',
        sql: `CREATE POLICY "calendar_events_select_policy" ON calendar_events
              FOR SELECT USING (
                EXISTS (
                  SELECT 1 FROM usuarios u 
                  WHERE u.auth_user_id = auth.uid() 
                  AND u.funcao IN ('super_admin', 'equipe_interna', 'admin')
                )
              );`
      },
      {
        name: 'calendar_events_insert_policy',
        sql: `CREATE POLICY "calendar_events_insert_policy" ON calendar_events
              FOR INSERT WITH CHECK (
                EXISTS (
                  SELECT 1 FROM usuarios u 
                  WHERE u.auth_user_id = auth.uid() 
                  AND u.funcao IN ('super_admin', 'equipe_interna', 'admin')
                )
              );`
      },
      {
        name: 'calendar_events_update_policy',
        sql: `CREATE POLICY "calendar_events_update_policy" ON calendar_events
              FOR UPDATE USING (
                EXISTS (
                  SELECT 1 FROM usuarios u 
                  WHERE u.auth_user_id = auth.uid() 
                  AND u.funcao IN ('super_admin', 'equipe_interna', 'admin')
                )
              );`
      },
      {
        name: 'calendar_events_delete_policy',
        sql: `CREATE POLICY "calendar_events_delete_policy" ON calendar_events
              FOR DELETE USING (
                EXISTS (
                  SELECT 1 FROM usuarios u 
                  WHERE u.auth_user_id = auth.uid() 
                  AND u.funcao IN ('super_admin', 'equipe_interna', 'admin')
                )
              );`
      }
    ];
    
    for (const policy of policies) {
      const { error: policyError } = await supabaseAdmin.rpc('exec_sql', { sql: policy.sql });
      if (policyError) {
        console.log(`⚠️ Aviso ao criar política ${policy.name}: ${policyError.message}`);
      } else {
        console.log(`✅ Política ${policy.name} criada`);
      }
    }
    
    // 7. Criar trigger para updated_at
    console.log('7. Criando trigger para updated_at...');
    const triggerQuery = `
      CREATE TRIGGER update_calendar_events_updated_at 
      BEFORE UPDATE ON calendar_events 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;
    
    const { error: triggerError } = await supabaseAdmin.rpc('exec_sql', { sql: triggerQuery });
    
    if (triggerError) {
      console.log(`⚠️ Aviso ao criar trigger: ${triggerError.message}`);
    } else {
      console.log('✅ Trigger criado');
    }
    
    // 8. Testar inserção
    console.log('8. Testando inserção de evento...');
    const testEventData = {
      titulo: 'Evento Teste Migração',
      descricao: 'Teste após aplicação completa da migração',
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
    } else {
      console.log('✅ Evento de teste inserido com sucesso!');
      console.log('ID do evento:', newEvent[0]?.id);
    }
    
    console.log('\n🎉 Migração da tabela calendar_events aplicada com sucesso!');
    console.log('⚠️ IMPORTANTE: Reinicie o servidor backend para atualizar o cache do schema.');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

applyCalendarEventsMigration();