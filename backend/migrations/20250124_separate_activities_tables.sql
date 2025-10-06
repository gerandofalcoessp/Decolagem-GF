-- Migração: Separar tabela activities em regional_activities e calendar_events
-- Data: 2025-01-24
-- Descrição: Separa atividades regionais dos eventos de calendário para melhor organização

-- ============================================================================
-- PASSO 1: BACKUP DA TABELA ATUAL
-- ============================================================================

-- Criar backup da tabela activities atual
CREATE TABLE activities_backup AS SELECT * FROM activities;

-- ============================================================================
-- PASSO 2: CRIAR NOVA TABELA PARA ATIVIDADES REGIONAIS
-- ============================================================================

CREATE TABLE regional_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_date DATE NOT NULL,
    type VARCHAR(100),
    responsavel_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    regional VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ativo',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_regional_activities_member_id ON regional_activities(member_id);
CREATE INDEX idx_regional_activities_responsavel_id ON regional_activities(responsavel_id);
CREATE INDEX idx_regional_activities_activity_date ON regional_activities(activity_date);
CREATE INDEX idx_regional_activities_regional ON regional_activities(regional);
CREATE INDEX idx_regional_activities_type ON regional_activities(type);

-- ============================================================================
-- PASSO 3: CRIAR NOVA TABELA PARA EVENTOS DO CALENDÁRIO
-- ============================================================================

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

-- Índices para performance
CREATE INDEX idx_calendar_events_responsavel_id ON calendar_events(responsavel_id);
CREATE INDEX idx_calendar_events_data_inicio ON calendar_events(data_inicio);
CREATE INDEX idx_calendar_events_regional ON calendar_events(regional);
CREATE INDEX idx_calendar_events_programa ON calendar_events(programa);
CREATE INDEX idx_calendar_events_tipo ON calendar_events(tipo);

-- ============================================================================
-- PASSO 4: MIGRAR DADOS EXISTENTES
-- ============================================================================

-- Migrar atividades regionais (baseado na presença de campos específicos)
-- Critério: registros que têm title e member_id (atividades regionais)
INSERT INTO regional_activities (
    id,
    member_id,
    title,
    description,
    activity_date,
    type,
    responsavel_id,
    status,
    observacoes,
    created_at,
    updated_at
)
SELECT 
    id,
    member_id,
    title,
    description,
    COALESCE(activity_date::date, created_at::date) as activity_date,
    COALESCE(type, 'geral') as type,
    responsavel_id,
    'ativo' as status,
    NULL as observacoes, -- Campo não existe na tabela original
    created_at,
    created_at as updated_at -- Campo não existe na tabela original
FROM activities
WHERE 
    member_id IS NOT NULL;

-- Migrar eventos do calendário (baseado na ausência de member_id)
-- Critério: registros que NÃO têm member_id (eventos de calendário)
INSERT INTO calendar_events (
    id,
    titulo,
    descricao,
    tipo,
    data_inicio,
    data_fim,
    local,
    programa,
    responsavel_id,
    participantes_esperados,
    participantes_confirmados,
    quantidade,
    evidencias,
    status,
    observacoes,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id, -- Novo ID para evitar conflitos
    COALESCE(titulo, title) as titulo,
    description as descricao,
    COALESCE(type, 'evento') as tipo,
    COALESCE(activity_date::timestamp, created_at) as data_inicio,
    NULL as data_fim, -- Campo não existe na tabela original
    NULL as local, -- Campo não existe na tabela original
    NULL as programa, -- Campo não existe na tabela original
    responsavel_id,
    NULL as participantes_esperados, -- Campo não existe na tabela original
    0 as participantes_confirmados,
    NULL as quantidade, -- Campo não existe na tabela original
    '[]'::jsonb as evidencias,
    'ativo' as status,
    NULL as observacoes, -- Campo não existe na tabela original
    created_at,
    created_at as updated_at -- Campo não existe na tabela original
FROM activities
WHERE 
    member_id IS NULL;

-- ============================================================================
-- PASSO 5: HABILITAR RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE regional_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para regional_activities
CREATE POLICY "regional_activities_select_policy" ON regional_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members m 
            WHERE m.id = regional_activities.member_id 
            AND m.auth_user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.funcao IN ('super_admin', 'equipe_interna')
        )
    );

CREATE POLICY "regional_activities_insert_policy" ON regional_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM members m 
            WHERE m.id = regional_activities.member_id 
            AND m.auth_user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.funcao IN ('super_admin', 'equipe_interna')
        )
    );

CREATE POLICY "regional_activities_update_policy" ON regional_activities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM members m 
            WHERE m.id = regional_activities.member_id 
            AND m.auth_user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.funcao IN ('super_admin', 'equipe_interna')
        )
    );

-- Políticas RLS para calendar_events
CREATE POLICY "calendar_events_select_policy" ON calendar_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "calendar_events_insert_policy" ON calendar_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.funcao IN ('super_admin', 'equipe_interna', 'admin')
        )
    );

CREATE POLICY "calendar_events_update_policy" ON calendar_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.funcao IN ('super_admin', 'equipe_interna', 'admin')
        )
    );

CREATE POLICY "calendar_events_delete_policy" ON calendar_events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.funcao IN ('super_admin', 'equipe_interna', 'admin')
        )
    );

-- ============================================================================
-- PASSO 6: TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para as novas tabelas
CREATE TRIGGER update_regional_activities_updated_at 
    BEFORE UPDATE ON regional_activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at 
    BEFORE UPDATE ON calendar_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PASSO 7: COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE regional_activities IS 'Atividades operacionais das regionais registradas através do formulário /regionais';
COMMENT ON TABLE calendar_events IS 'Eventos e compromissos do calendário global e regionais';

COMMENT ON COLUMN regional_activities.member_id IS 'Referência ao membro que registrou a atividade';
COMMENT ON COLUMN regional_activities.title IS 'Título da atividade regional';
COMMENT ON COLUMN regional_activities.activity_date IS 'Data em que a atividade foi realizada';
COMMENT ON COLUMN regional_activities.responsavel_id IS 'Usuário responsável pela atividade';

COMMENT ON COLUMN calendar_events.titulo IS 'Título do evento no calendário';
COMMENT ON COLUMN calendar_events.data_inicio IS 'Data e hora de início do evento';
COMMENT ON COLUMN calendar_events.data_fim IS 'Data e hora de fim do evento (opcional)';
COMMENT ON COLUMN calendar_events.participantes_confirmados IS 'Número de participantes confirmados';

-- ============================================================================
-- VERIFICAÇÕES FINAIS
-- ============================================================================

-- Verificar contagem de registros migrados
DO $$
DECLARE
    original_count INTEGER;
    regional_count INTEGER;
    calendar_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO original_count FROM activities;
    SELECT COUNT(*) INTO regional_count FROM regional_activities;
    SELECT COUNT(*) INTO calendar_count FROM calendar_events;
    
    RAISE NOTICE 'Migração concluída:';
    RAISE NOTICE '- Registros originais: %', original_count;
    RAISE NOTICE '- Atividades regionais: %', regional_count;
    RAISE NOTICE '- Eventos de calendário: %', calendar_count;
    RAISE NOTICE '- Total migrado: %', regional_count + calendar_count;
END $$;

-- ============================================================================
-- INSTRUÇÕES PARA FINALIZAÇÃO
-- ============================================================================

-- IMPORTANTE: Após validar que tudo está funcionando corretamente:
-- 1. Atualize as APIs do backend para usar as novas tabelas
-- 2. Teste todas as funcionalidades
-- 3. Quando tiver certeza, execute: DROP TABLE activities;
-- 4. Mantenha activities_backup por alguns dias como segurança
-- 5. Depois execute: DROP TABLE activities_backup;