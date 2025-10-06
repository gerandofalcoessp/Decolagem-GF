-- Migration: Update 'Regionais' to 'Área' in database
-- Date: 2025-01-22
-- Description: Update all occurrences of 'Regionais' to 'Área' in goals table descriptions
-- to align with frontend terminology changes

BEGIN;

-- Update goals table descriptions: replace 'Regionais:' with 'Área:'
UPDATE public.goals
SET descricao = regexp_replace(
  descricao,
  '(.*\|\s*)Regionais(\s*:\s*.*)',
  '\1Área\2',
  'gi'
)
WHERE descricao IS NOT NULL
  AND descricao ~* 'regionais\s*:';

-- Update goals table descriptions: replace 'regionais' with 'área' (case insensitive)
UPDATE public.goals
SET descricao = regexp_replace(
  descricao,
  '\bregionais\b',
  'área',
  'gi'
)
WHERE descricao IS NOT NULL
  AND descricao ~* '\bregionais\b';

-- Log the changes made
DO $$
DECLARE
    updated_count integer;
BEGIN
    -- Count how many records were updated
    SELECT COUNT(*) INTO updated_count
    FROM public.goals
    WHERE descricao IS NOT NULL
      AND descricao ~* 'área\s*:';
    
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '📊 Records with "Área:" in description: %', updated_count;
    
    -- Show sample of updated records
    RAISE NOTICE '📝 Sample of updated records:';
    FOR rec IN 
        SELECT id, nome, descricao 
        FROM public.goals 
        WHERE descricao ~* 'área\s*:' 
        LIMIT 5
    LOOP
        RAISE NOTICE '  - ID: %, Nome: %, Descrição: %', rec.id, rec.nome, rec.descricao;
    END LOOP;
END $$;

COMMIT;