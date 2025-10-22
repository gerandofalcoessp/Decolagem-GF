-- Migração: Habilitar Realtime para instituicoes
-- Data: 2025-10-21
-- Descrição: Configura a tabela instituicoes para publicar eventos em tempo real via supabase_realtime e garante REPLICA IDENTITY FULL para updates.

-- Garantir que updates emitam dados completos
ALTER TABLE public.instituicoes REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação de realtime do Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE public.instituicoes;