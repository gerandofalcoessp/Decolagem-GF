-- Migração: Habilitar Realtime para regional_activities
-- Data: 2025-10-20
-- Descrição: Configura a tabela regional_activities para publicar eventos em tempo real via supabase_realtime e garante REPLICA IDENTITY FULL para updates.

-- Garantir que updates emitam dados completos
ALTER TABLE public.regional_activities REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação de realtime do Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE public.regional_activities;