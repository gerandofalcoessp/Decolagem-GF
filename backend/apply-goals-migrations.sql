-- Script para aplicar manualmente as migrações da tabela goals
-- Este script deve ser executado no Supabase SQL Editor

-- ETAPA 1: Adicionar as colunas que faltam (baseado na migração 20250121_add_missing_fields_to_goals.sql)
DO $$
BEGIN
    -- Adicionar description se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'goals' AND column_name = 'description' AND table_schema = 'public') THEN
        ALTER TABLE public.goals ADD COLUMN description TEXT;
        COMMENT ON COLUMN public.goals.description IS 'Descrição detalhada da meta';
        RAISE NOTICE 'Coluna description adicionada';
    ELSE
        RAISE NOTICE 'Coluna description já existe';
    END IF;
    
    -- Adicionar target_value se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'goals' AND column_name = 'target_value' AND table_schema = 'public') THEN
        ALTER TABLE public.goals ADD COLUMN target_value NUMERIC;
        COMMENT ON COLUMN public.goals.target_value IS 'Valor alvo da meta';
        RAISE NOTICE 'Coluna target_value adicionada';
    ELSE
        RAISE NOTICE 'Coluna target_value já existe';
    END IF;
    
    -- Adicionar current_value se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'goals' AND column_name = 'current_value' AND table_schema = 'public') THEN
        ALTER TABLE public.goals ADD COLUMN current_value NUMERIC DEFAULT 0;
        COMMENT ON COLUMN public.goals.current_value IS 'Valor atual da meta';
        RAISE NOTICE 'Coluna current_value adicionada';
    ELSE
        RAISE NOTICE 'Coluna current_value já existe';
    END IF;
END $$;

-- Criar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_goals_target_value ON public.goals(target_value);
CREATE INDEX IF NOT EXISTS idx_goals_current_value ON public.goals(current_value);

-- ETAPA 2: Renomear as colunas (baseado na migração 20250121_update_goals_table_fields.sql)
DO $$
BEGIN
    -- Renomear title para nome se title existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'goals' AND column_name = 'title' AND table_schema = 'public') THEN
        ALTER TABLE public.goals RENAME COLUMN title TO nome;
        RAISE NOTICE 'Coluna title renomeada para nome';
    ELSE
        RAISE NOTICE 'Coluna title não existe ou já foi renomeada';
    END IF;
    
    -- Renomear description para descricao se description existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'goals' AND column_name = 'description' AND table_schema = 'public') THEN
        ALTER TABLE public.goals RENAME COLUMN description TO descricao;
        RAISE NOTICE 'Coluna description renomeada para descricao';
    ELSE
        RAISE NOTICE 'Coluna description não existe ou já foi renomeada';
    END IF;
    
    -- Renomear target_value para valor_meta se target_value existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'goals' AND column_name = 'target_value' AND table_schema = 'public') THEN
        ALTER TABLE public.goals RENAME COLUMN target_value TO valor_meta;
        RAISE NOTICE 'Coluna target_value renomeada para valor_meta';
    ELSE
        RAISE NOTICE 'Coluna target_value não existe ou já foi renomeada';
    END IF;
    
    -- Renomear current_value para valor_atual se current_value existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'goals' AND column_name = 'current_value' AND table_schema = 'public') THEN
        ALTER TABLE public.goals RENAME COLUMN current_value TO valor_atual;
        RAISE NOTICE 'Coluna current_value renomeada para valor_atual';
    ELSE
        RAISE NOTICE 'Coluna current_value não existe ou já foi renomeada';
    END IF;
END $$;

-- ETAPA 3: Atualizar comentários das colunas finais
COMMENT ON COLUMN public.goals.nome IS 'Nome da meta';
COMMENT ON COLUMN public.goals.descricao IS 'Descrição detalhada da meta';
COMMENT ON COLUMN public.goals.valor_meta IS 'Valor alvo da meta';
COMMENT ON COLUMN public.goals.valor_atual IS 'Valor atual da meta';

-- ETAPA 4: Atualizar índices
DROP INDEX IF EXISTS idx_goals_title;
DROP INDEX IF EXISTS idx_goals_target_value;
DROP INDEX IF EXISTS idx_goals_current_value;

CREATE INDEX IF NOT EXISTS idx_goals_nome ON public.goals(nome);
CREATE INDEX IF NOT EXISTS idx_goals_valor_meta ON public.goals(valor_meta);
CREATE INDEX IF NOT EXISTS idx_goals_valor_atual ON public.goals(valor_atual);

-- ETAPA 5: Verificar a estrutura final da tabela
SELECT 
    'Estrutura final da tabela goals:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'goals' 
  AND table_schema = 'public'
ORDER BY ordinal_position;