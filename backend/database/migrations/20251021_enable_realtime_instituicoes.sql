-- Migração: Habilitar Realtime para instituicoes (idempotente)
-- Data: 2025-10-21
-- Descrição: Configura a tabela instituicoes para publicar eventos em tempo real via supabase_realtime e garante REPLICA IDENTITY FULL para updates.

begin;

-- Garantir que updates emitam dados completos (não falha se já estiver configurado)
ALTER TABLE IF EXISTS public.instituicoes REPLICA IDENTITY FULL;

-- Garantir que a publicação supabase_realtime exista
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Adicionar tabela à publicação de realtime apenas se ainda não for membro
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication p
    JOIN pg_publication_rel pr ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'instituicoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.instituicoes;
  END IF;
END
$$;

commit;