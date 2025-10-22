-- Migração para adicionar coluna programas à tabela instituicoes
-- Esta migração deve ser executada manualmente no Supabase SQL Editor

-- Adicionar coluna programas como array de strings
ALTER TABLE instituicoes 
ADD COLUMN programas text[];

-- Migrar dados existentes: converter programa único para array
UPDATE instituicoes 
SET programas = ARRAY[programa] 
WHERE programa IS NOT NULL AND programas IS NULL;

-- Comentário: A coluna programa será mantida por compatibilidade
-- mas o frontend e backend agora usarão a coluna programas