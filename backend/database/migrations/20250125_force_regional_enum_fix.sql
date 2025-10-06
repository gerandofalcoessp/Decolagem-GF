-- Migração: Forçar correção do enum regional_type
-- Data: 2025-01-25
-- Descrição: Força a recriação do enum regional_type com valores corretos

BEGIN;

-- Primeiro, remover todas as dependências do enum
DROP TABLE IF EXISTS instituicoes CASCADE;

-- Remover o enum antigo completamente
DROP TYPE IF EXISTS regional_type CASCADE;
DROP TYPE IF EXISTS programa_type CASCADE;
DROP TYPE IF EXISTS status_type CASCADE;
DROP TYPE IF EXISTS instituicao_status CASCADE;

-- Recriar todos os enums necessários
CREATE TYPE regional_type AS ENUM (
  'nacional',
  'centro_oeste',
  'mg_es',
  'nordeste_1',
  'nordeste_2',
  'norte',
  'rj',
  'sp',
  'sul',
  'comercial'
);

CREATE TYPE programa_type AS ENUM (
  'decolagem',
  'as_maras',
  'microcredito'
);

CREATE TYPE status_type AS ENUM (
  'ativa',
  'inativa',
  'evadida'
);

-- Recriar a tabela instituicoes
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
  regional regional_type NOT NULL,
  programa programa_type NOT NULL,
  observacoes TEXT,
  nome_lider VARCHAR(255),
  status status_type DEFAULT 'ativa',
  evasao_motivo TEXT,
  evasao_data DATE,
  evasao_registrado_em TIMESTAMP,
  documentos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recriar o trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instituicoes_updated_at 
  BEFORE UPDATE ON instituicoes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE instituicoes ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações para usuários autenticados
CREATE POLICY "Permitir todas as operações para usuários autenticados" ON instituicoes
  FOR ALL USING (auth.role() = 'authenticated');

COMMIT;