-- Migration: Criar meta padrão 'Atendidos Diretamente' para regionais e meses selecionados (exemplo)
-- Observação: ajuste conforme necessidade real de criação em massa ou deixe a criação via app.
-- Data: 2025-10-03

BEGIN;

-- Opcional: inserir uma meta exemplo para 2025, todo-ano, todas regionais.
-- Remova se preferir criar via app.
INSERT INTO goals (nome, descricao, valor_meta, valor_atual, due_date, status)
VALUES (
  'Atendidos Diretamente',
  'Meta: 0 pessoas | Meses: todo-ano | Regionais: Todas',
  0,
  0,
  '2025-12-31',
  'pending'
);

COMMIT;