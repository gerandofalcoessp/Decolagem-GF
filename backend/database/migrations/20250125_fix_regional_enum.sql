-- Corrigir enum regional_type para usar underscore
-- Primeiro, remover o enum existente se houver dados
DROP TYPE IF EXISTS regional_type CASCADE;

-- Recriar o enum com os valores corretos
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

-- Recriar a tabela instituicoes com o enum corrigido
DROP TABLE IF EXISTS instituicoes;

CREATE TABLE instituicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  endereco TEXT NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  cep VARCHAR(9) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  regional regional_type NOT NULL,
  programa programa_type NOT NULL,
  observacoes TEXT,
  nome_lider VARCHAR(255) NOT NULL,
  status status_type DEFAULT 'ativa',
  evasao_motivo TEXT,
  evasao_data DATE,
  evasao_registrado_em TIMESTAMP,
  documentos TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instituicoes_updated_at BEFORE UPDATE ON instituicoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();