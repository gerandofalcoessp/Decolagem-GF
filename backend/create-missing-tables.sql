-- Script para criar tabelas ausentes no banco de dados
-- Baseado nos erros encontrados no debug das APIs

BEGIN;

-- 1. Criar tabela emprestimos (para /microcredito)
CREATE TABLE IF NOT EXISTS public.emprestimos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  taxa_juros DECIMAL(5,2) DEFAULT 0,
  prazo_meses INTEGER NOT NULL,
  data_emprestimo DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'quitado', 'em_atraso', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para emprestimos
CREATE INDEX IF NOT EXISTS idx_emprestimos_member_id ON public.emprestimos(member_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_status ON public.emprestimos(status);
CREATE INDEX IF NOT EXISTS idx_emprestimos_data_emprestimo ON public.emprestimos(data_emprestimo);

-- 2. Criar tabela participantes_asmaras (para /asmaras)
CREATE TABLE IF NOT EXISTS public.participantes_asmaras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  idade INTEGER,
  genero VARCHAR(20) CHECK (genero IN ('masculino', 'feminino', 'outro')),
  telefone VARCHAR(20),
  endereco TEXT,
  data_ingresso DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'concluido')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para participantes_asmaras
CREATE INDEX IF NOT EXISTS idx_participantes_asmaras_member_id ON public.participantes_asmaras(member_id);
CREATE INDEX IF NOT EXISTS idx_participantes_asmaras_status ON public.participantes_asmaras(status);
CREATE INDEX IF NOT EXISTS idx_participantes_asmaras_data_ingresso ON public.participantes_asmaras(data_ingresso);

-- 3. Criar tabela familias_decolagem (para /decolagem)
CREATE TABLE IF NOT EXISTS public.familias_decolagem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  nome_responsavel VARCHAR(255) NOT NULL,
  numero_membros INTEGER DEFAULT 1,
  renda_familiar DECIMAL(10,2),
  endereco TEXT,
  telefone VARCHAR(20),
  data_cadastro DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'graduado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para familias_decolagem
CREATE INDEX IF NOT EXISTS idx_familias_decolagem_member_id ON public.familias_decolagem(member_id);
CREATE INDEX IF NOT EXISTS idx_familias_decolagem_status ON public.familias_decolagem(status);
CREATE INDEX IF NOT EXISTS idx_familias_decolagem_data_cadastro ON public.familias_decolagem(data_cadastro);

-- 4. Adicionar colunas ausentes na tabela goals
DO $$
BEGIN
    -- Adicionar current_value se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'goals' AND column_name = 'current_value' AND table_schema = 'public') THEN
        ALTER TABLE public.goals ADD COLUMN current_value NUMERIC DEFAULT 0;
        RAISE NOTICE 'Coluna current_value adicionada à tabela goals';
    END IF;
END $$;

-- 5. Adicionar colunas ausentes na tabela activities
DO $$
BEGIN
    -- Adicionar type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'type' AND table_schema = 'public') THEN
        ALTER TABLE public.activities ADD COLUMN type VARCHAR(50) DEFAULT 'general';
        RAISE NOTICE 'Coluna type adicionada à tabela activities';
    END IF;
    
    -- Adicionar titulo se não existir (alternativa ao title)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'titulo' AND table_schema = 'public') THEN
        ALTER TABLE public.activities ADD COLUMN titulo VARCHAR(255);
        RAISE NOTICE 'Coluna titulo adicionada à tabela activities';
    END IF;
END $$;

-- 6. Criar políticas RLS para as novas tabelas

-- RLS para emprestimos
ALTER TABLE public.emprestimos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own emprestimos" ON public.emprestimos
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM public.members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own emprestimos" ON public.emprestimos
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own emprestimos" ON public.emprestimos
  FOR UPDATE USING (
    member_id IN (
      SELECT id FROM public.members WHERE auth_user_id = auth.uid()
    )
  );

-- RLS para participantes_asmaras
ALTER TABLE public.participantes_asmaras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own participantes_asmaras" ON public.participantes_asmaras
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM public.members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own participantes_asmaras" ON public.participantes_asmaras
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own participantes_asmaras" ON public.participantes_asmaras
  FOR UPDATE USING (
    member_id IN (
      SELECT id FROM public.members WHERE auth_user_id = auth.uid()
    )
  );

-- RLS para familias_decolagem
ALTER TABLE public.familias_decolagem ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own familias_decolagem" ON public.familias_decolagem
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM public.members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own familias_decolagem" ON public.familias_decolagem
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own familias_decolagem" ON public.familias_decolagem
  FOR UPDATE USING (
    member_id IN (
      SELECT id FROM public.members WHERE auth_user_id = auth.uid()
    )
  );

-- 7. Criar triggers para updated_at nas novas tabelas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para emprestimos
CREATE TRIGGER update_emprestimos_updated_at 
    BEFORE UPDATE ON public.emprestimos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para participantes_asmaras
CREATE TRIGGER update_participantes_asmaras_updated_at 
    BEFORE UPDATE ON public.participantes_asmaras 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para familias_decolagem
CREATE TRIGGER update_familias_decolagem_updated_at 
    BEFORE UPDATE ON public.familias_decolagem 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Verificar se as tabelas foram criadas
SELECT 'Verificando tabelas criadas:' as info;

SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('emprestimos', 'participantes_asmaras', 'familias_decolagem')
ORDER BY table_name;