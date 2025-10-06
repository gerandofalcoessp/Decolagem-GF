-- Script para adicionar colunas faltantes na tabela regional_activities
-- Execute este script no Supabase SQL Editor ou via psql

-- Adicionar coluna programa (VARCHAR)
ALTER TABLE regional_activities 
ADD COLUMN IF NOT EXISTS programa VARCHAR(100);

-- Adicionar coluna estados (JSONB para armazenar array de estados)
ALTER TABLE regional_activities 
ADD COLUMN IF NOT EXISTS estados JSONB DEFAULT '[]'::jsonb;

-- Adicionar coluna instituicao_id (UUID para referência à instituição)
ALTER TABLE regional_activities 
ADD COLUMN IF NOT EXISTS instituicao_id UUID;

-- Adicionar coluna quantidade (INTEGER para métricas numéricas)
ALTER TABLE regional_activities 
ADD COLUMN IF NOT EXISTS quantidade INTEGER;

-- Adicionar coluna atividade_label (VARCHAR para label legível)
ALTER TABLE regional_activities 
ADD COLUMN IF NOT EXISTS atividade_label VARCHAR(255);

-- Adicionar coluna atividade_custom_label (VARCHAR para label customizado)
ALTER TABLE regional_activities 
ADD COLUMN IF NOT EXISTS atividade_custom_label VARCHAR(255);

-- Comentários nas colunas para documentação
COMMENT ON COLUMN regional_activities.programa IS 'Programa da atividade (ex: decolagem, outro)';
COMMENT ON COLUMN regional_activities.estados IS 'Array JSON dos estados selecionados';
COMMENT ON COLUMN regional_activities.instituicao_id IS 'ID da instituição relacionada à atividade';
COMMENT ON COLUMN regional_activities.quantidade IS 'Quantidade/métrica numérica da atividade';
COMMENT ON COLUMN regional_activities.atividade_label IS 'Label legível da atividade (ex: Ligas Maras Formadas)';
COMMENT ON COLUMN regional_activities.atividade_custom_label IS 'Label customizado pelo usuário';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'regional_activities' 
  AND table_schema = 'public'
ORDER BY ordinal_position;