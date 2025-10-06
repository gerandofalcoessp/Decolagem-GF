-- Migração: Recriação completa do enum regional_type
-- Data: 2025-01-25
-- Descrição: Remove e recria completamente o enum regional_type com todos os valores necessários

BEGIN;

-- 1. Criar um backup temporário dos dados da tabela instituicoes
CREATE TEMP TABLE temp_instituicoes_backup AS 
SELECT * FROM instituicoes;

-- 2. Dropar a tabela que usa o enum
DROP TABLE IF EXISTS instituicoes CASCADE;

-- 3. Dropar o enum antigo
DROP TYPE IF EXISTS regional_type CASCADE;

-- 4. Recriar o enum com TODOS os valores necessários
CREATE TYPE regional_type AS ENUM (
    'nacional',
    'comercial', 
    'centro_oeste',
    'mg_es',
    'nordeste_1',
    'nordeste_2',
    'norte',
    'rj',
    'sp',
    'sul'
);

-- 5. Recriar a tabela instituicoes
CREATE TABLE instituicoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(9),
    telefone VARCHAR(20),
    email VARCHAR(255),
    nome_lider VARCHAR(255),
    regional regional_type NOT NULL DEFAULT 'nacional',
    programa programa_type NOT NULL DEFAULT 'decolagem',
    status status_type NOT NULL DEFAULT 'ativa',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Restaurar os dados (se houver)
INSERT INTO instituicoes (
    id, nome, cnpj, endereco, cidade, estado, cep, telefone, email, 
    nome_lider, regional, programa, status, observacoes, created_at, updated_at
)
SELECT 
    id, nome, cnpj, endereco, cidade, estado, cep, telefone, email,
    nome_lider, 
    CASE 
        WHEN regional = 'centro-oeste' THEN 'centro_oeste'::regional_type
        WHEN regional = 'mg/es' THEN 'mg_es'::regional_type
        WHEN regional = 'nordeste 1' THEN 'nordeste_1'::regional_type
        WHEN regional = 'nordeste 2' THEN 'nordeste_2'::regional_type
        WHEN regional = 'rio de janeiro' THEN 'rj'::regional_type
        WHEN regional = 'são paulo' THEN 'sp'::regional_type
        ELSE regional::regional_type
    END,
    programa, status, observacoes, created_at, updated_at
FROM temp_instituicoes_backup
WHERE EXISTS (SELECT 1 FROM temp_instituicoes_backup LIMIT 1);

-- 7. Recriar índices e constraints
CREATE INDEX IF NOT EXISTS idx_instituicoes_regional ON instituicoes(regional);
CREATE INDEX IF NOT EXISTS idx_instituicoes_programa ON instituicoes(programa);
CREATE INDEX IF NOT EXISTS idx_instituicoes_status ON instituicoes(status);

-- 8. Configurar RLS (Row Level Security)
ALTER TABLE instituicoes ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura para usuários autenticados" ON instituicoes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserção para usuários autenticados
CREATE POLICY "Permitir inserção para usuários autenticados" ON instituicoes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir atualização para usuários autenticados
CREATE POLICY "Permitir atualização para usuários autenticados" ON instituicoes
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para permitir exclusão para usuários autenticados
CREATE POLICY "Permitir exclusão para usuários autenticados" ON instituicoes
    FOR DELETE USING (auth.role() = 'authenticated');

COMMIT;