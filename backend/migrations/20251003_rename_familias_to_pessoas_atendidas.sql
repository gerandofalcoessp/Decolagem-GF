-- Migration: Renomear metas de 'Famílias atendidas' para 'Pessoas Atendidas'
-- e atualizar unidade na descrição para 'pessoas'

BEGIN;

-- Renomear nome da meta
UPDATE public.goals
SET nome = 'Pessoas Atendidas'
WHERE nome IS NOT NULL
  AND nome <> 'Pessoas Atendidas'
  AND LOWER(nome) LIKE '%famílias%'
  AND LOWER(nome) LIKE '%atendidas%';

-- Atualizar unidade na descrição: substituir 'unidades' ou 'famílias' por 'pessoas'
-- Formato esperado: "Meta: <valor><unidade> | Meses: ... | Regionais: ..."
UPDATE public.goals
SET descricao = regexp_replace(
  descricao,
  '(Meta:\s*)([0-9]+(?:\.[0-9]+)?)\s*(unidades|famílias?)',
  '\1\2 pessoas',
  'gi'
)
WHERE nome = 'Pessoas Atendidas'
  AND descricao IS NOT NULL
  AND descricao ~* 'Meta:\s*[0-9]';

COMMIT;