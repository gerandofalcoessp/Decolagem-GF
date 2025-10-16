-- Script para adicionar as colunas de evasão na tabela instituicoes
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se as colunas já existem
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'instituicoes' 
AND table_schema = 'public'
AND column_name IN ('evasao_data', 'evasao_motivo', 'evasao_registrado_em')
ORDER BY column_name;

-- 2. Adicionar as colunas de evasão se não existirem
DO $$
BEGIN
    -- Adicionar coluna evasao_data
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'instituicoes' 
        AND table_schema = 'public' 
        AND column_name = 'evasao_data'
    ) THEN
        ALTER TABLE public.instituicoes ADD COLUMN evasao_data date;
        RAISE NOTICE 'Coluna evasao_data adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna evasao_data já existe';
    END IF;

    -- Adicionar coluna evasao_motivo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'instituicoes' 
        AND table_schema = 'public' 
        AND column_name = 'evasao_motivo'
    ) THEN
        ALTER TABLE public.instituicoes ADD COLUMN evasao_motivo text;
        RAISE NOTICE 'Coluna evasao_motivo adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna evasao_motivo já existe';
    END IF;

    -- Adicionar coluna evasao_registrado_em
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'instituicoes' 
        AND table_schema = 'public' 
        AND column_name = 'evasao_registrado_em'
    ) THEN
        ALTER TABLE public.instituicoes ADD COLUMN evasao_registrado_em timestamptz;
        RAISE NOTICE 'Coluna evasao_registrado_em adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna evasao_registrado_em já existe';
    END IF;
END $$;

-- 3. Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'instituicoes' 
AND table_schema = 'public'
AND column_name IN ('evasao_data', 'evasao_motivo', 'evasao_registrado_em')
ORDER BY column_name;

-- 4. Atualizar as políticas RLS para incluir as novas colunas (se necessário)
-- As políticas existentes já permitem acesso completo para usuários autenticados,
-- então não é necessário modificá-las especificamente para essas colunas.

COMMIT;