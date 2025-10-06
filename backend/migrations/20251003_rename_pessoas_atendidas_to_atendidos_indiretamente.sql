-- Migration: Renomear metas de 'Pessoas Atendidas' para 'Atendidos Indiretamente' e ajustar unidades para 'pessoas'
-- Data: 2025-10-03

BEGIN;

-- Renomear metas existentes no banco
UPDATE goals
SET nome = 'Atendidos Indiretamente'
WHERE nome = 'Pessoas Atendidas';

-- Ajustar a unidade na descrição para 'pessoas' quando detectado padrões antigos
UPDATE goals
SET descricao = regexp_replace(descricao, '(Meta:\s*)(\d+(?:[\.,]\d+)?)(\s*(unidades|famílias|familia|pessoa|pessoas)?)', '\1\2 pessoas', 'gi')
WHERE nome = 'Atendidos Indiretamente';

-- Garantir consistência de valor_meta em caso de porcentagens indevidas
UPDATE goals
SET valor_meta = valor_meta
WHERE nome = 'Atendidos Indiretamente' AND descricao ILIKE '%Meta:%';

COMMIT;