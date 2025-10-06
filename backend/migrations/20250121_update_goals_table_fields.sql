-- Atualizar a tabela goals para usar os nomes de campos corretos
-- Renomear campos para corresponder à interface Meta do frontend

-- Renomear title para nome
ALTER TABLE public.goals RENAME COLUMN title TO nome;

-- Renomear description para descricao
ALTER TABLE public.goals RENAME COLUMN description TO descricao;

-- Renomear target_value para valor_meta
ALTER TABLE public.goals RENAME COLUMN target_value TO valor_meta;

-- Renomear current_value para valor_atual
ALTER TABLE public.goals RENAME COLUMN current_value TO valor_atual;

-- Atualizar comentários das colunas
COMMENT ON COLUMN public.goals.nome IS 'Nome da meta';
COMMENT ON COLUMN public.goals.descricao IS 'Descrição detalhada da meta';
COMMENT ON COLUMN public.goals.valor_meta IS 'Valor alvo da meta';
COMMENT ON COLUMN public.goals.valor_atual IS 'Valor atual da meta';

-- Atualizar índices se necessário
DROP INDEX IF EXISTS idx_goals_title;
CREATE INDEX idx_goals_nome ON public.goals(nome);