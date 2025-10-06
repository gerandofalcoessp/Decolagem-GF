-- Migração manual: Adicionar colunas funcao e area à tabela members
-- Execute este SQL no Supabase SQL Editor

BEGIN;

-- Adicionar coluna funcao se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' 
        AND column_name = 'funcao' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.members ADD COLUMN funcao text;
        RAISE NOTICE 'Coluna funcao adicionada à tabela members';
    ELSE
        RAISE NOTICE 'Coluna funcao já existe na tabela members';
    END IF;
END $$;

-- Adicionar coluna area se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' 
        AND column_name = 'area' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.members ADD COLUMN area text;
        RAISE NOTICE 'Coluna area adicionada à tabela members';
    ELSE
        RAISE NOTICE 'Coluna area já existe na tabela members';
    END IF;
END $$;

-- Adicionar comentários às colunas
COMMENT ON COLUMN public.members.funcao IS 'Função do membro na organização';
COMMENT ON COLUMN public.members.area IS 'Área de atuação do membro';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_members_funcao ON public.members(funcao);
CREATE INDEX IF NOT EXISTS idx_members_area ON public.members(area);

-- Verificar se as colunas foram criadas
DO $$
DECLARE
    funcao_exists boolean;
    area_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' 
        AND column_name = 'funcao' 
        AND table_schema = 'public'
    ) INTO funcao_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' 
        AND column_name = 'area' 
        AND table_schema = 'public'
    ) INTO area_exists;
    
    IF funcao_exists AND area_exists THEN
        RAISE NOTICE '✅ Migração concluída com sucesso! Colunas funcao e area foram adicionadas.';
    ELSE
        RAISE NOTICE '❌ Erro na migração. Funcao existe: %, Area existe: %', funcao_exists, area_exists;
    END IF;
END $$;

COMMIT;