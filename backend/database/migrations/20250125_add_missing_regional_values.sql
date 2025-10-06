-- Migração: Adicionar valores faltantes ao enum regional_type
-- Data: 2025-01-25
-- Descrição: Adiciona os valores que estão faltando no enum regional_type

BEGIN;

-- Adicionar os valores que estão faltando no enum regional_type
-- Verificar se cada valor já existe antes de adicionar

DO $$
BEGIN
    -- centro_oeste
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'centro_oeste' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'regional_type')) THEN
        ALTER TYPE regional_type ADD VALUE 'centro_oeste';
    END IF;
    
    -- mg_es
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'mg_es' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'regional_type')) THEN
        ALTER TYPE regional_type ADD VALUE 'mg_es';
    END IF;
    
    -- nordeste_1
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'nordeste_1' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'regional_type')) THEN
        ALTER TYPE regional_type ADD VALUE 'nordeste_1';
    END IF;
    
    -- nordeste_2
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'nordeste_2' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'regional_type')) THEN
        ALTER TYPE regional_type ADD VALUE 'nordeste_2';
    END IF;
    
    -- rj
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rj' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'regional_type')) THEN
        ALTER TYPE regional_type ADD VALUE 'rj';
    END IF;
    
    -- sp
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sp' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'regional_type')) THEN
        ALTER TYPE regional_type ADD VALUE 'sp';
    END IF;
END$$;

COMMIT;