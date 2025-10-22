-- Migração: Alterar campo programa para suportar múltiplos programas
-- Data: 2025-01-26
-- Descrição: Converte o campo programa de enum único para array de programas

BEGIN;

-- 1. Criar backup dos dados atuais
CREATE TEMP TABLE temp_instituicoes_backup AS 
SELECT id, nome, programa FROM public.instituicoes;

-- 2. Adicionar nova coluna programas como array
ALTER TABLE public.instituicoes 
ADD COLUMN programas text[] DEFAULT ARRAY[]::text[];

-- 3. Migrar dados existentes - converter programa único para array
UPDATE public.instituicoes 
SET programas = ARRAY[programa::text]
WHERE programa IS NOT NULL;

-- 4. Para registros sem programa, definir array vazio
UPDATE public.instituicoes 
SET programas = ARRAY[]::text[]
WHERE programa IS NULL;

-- 5. Verificar se a migração foi bem-sucedida
DO $$
DECLARE
    total_original INTEGER;
    total_migrado INTEGER;
    registros_vazios INTEGER;
BEGIN
    -- Contar registros originais
    SELECT COUNT(*) INTO total_original FROM temp_instituicoes_backup;
    
    -- Contar registros migrados com sucesso
    SELECT COUNT(*) INTO total_migrado 
    FROM public.instituicoes 
    WHERE programas IS NOT NULL AND array_length(programas, 1) > 0;
    
    -- Contar registros com array vazio (que tinham programa NULL)
    SELECT COUNT(*) INTO registros_vazios
    FROM public.instituicoes 
    WHERE programas = ARRAY[]::text[];
    
    RAISE NOTICE 'Migração concluída:';
    RAISE NOTICE '  - Total registros originais: %', total_original;
    RAISE NOTICE '  - Registros migrados com programa: %', total_migrado;
    RAISE NOTICE '  - Registros com array vazio: %', registros_vazios;
    
    IF (total_migrado + registros_vazios) = total_original THEN
        RAISE NOTICE '✅ Migração bem-sucedida!';
    ELSE
        RAISE EXCEPTION '❌ Erro na migração: números não conferem';
    END IF;
END $$;

-- 6. Criar índice para o novo campo
CREATE INDEX IF NOT EXISTS idx_instituicoes_programas ON public.instituicoes USING GIN(programas);

-- 7. Adicionar constraint para validar valores permitidos
ALTER TABLE public.instituicoes 
ADD CONSTRAINT check_programas_validos 
CHECK (
    programas <@ ARRAY['decolagem', 'as_maras', 'microcredito']::text[]
    AND array_length(programas, 1) > 0
);

-- 8. Comentários para documentação
COMMENT ON COLUMN public.instituicoes.programas IS 'Array de programas da instituição (decolagem, as_maras, microcredito)';
COMMENT ON COLUMN public.instituicoes.programa IS 'Campo legado - será removido em migração futura';

-- 9. Mostrar alguns exemplos dos dados migrados
DO $$
DECLARE
    exemplo RECORD;
BEGIN
    RAISE NOTICE 'Exemplos de dados migrados:';
    FOR exemplo IN 
        SELECT nome, programa, programas 
        FROM public.instituicoes 
        LIMIT 5
    LOOP
        RAISE NOTICE '  - %: % -> %', exemplo.nome, exemplo.programa, exemplo.programas;
    END LOOP;
END $$;

COMMIT;