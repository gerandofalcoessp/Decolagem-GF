-- Triggers para manter sincronização entre Supabase Auth e tabela usuarios
-- Este arquivo deve ser executado no Supabase Dashboard

-- 1. Função para sincronizar dados quando um usuário é criado no Auth
CREATE OR REPLACE FUNCTION sync_user_on_auth_create()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir novo usuário na tabela usuarios quando criado no Auth
  INSERT INTO public.usuarios (
    auth_user_id,
    email,
    nome,
    role,
    regional,
    tipo,
    funcao,
    area,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'regional', 'Nacional'),
    COALESCE(NEW.raw_user_meta_data->>'tipo', 'Nacional'),
    COALESCE(NEW.raw_user_meta_data->>'funcao', 'Não definido'),
    COALESCE(NEW.raw_user_meta_data->>'regional', 'Nacional'),
    'ativo',
    NOW(),
    NOW()
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = COALESCE(EXCLUDED.nome, usuarios.nome),
    role = COALESCE(EXCLUDED.role, usuarios.role),
    regional = COALESCE(EXCLUDED.regional, usuarios.regional),
    tipo = COALESCE(EXCLUDED.tipo, usuarios.tipo),
    funcao = COALESCE(EXCLUDED.funcao, usuarios.funcao),
    area = COALESCE(EXCLUDED.area, usuarios.area),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função para sincronizar dados quando um usuário é atualizado no Auth
CREATE OR REPLACE FUNCTION sync_user_on_auth_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar dados na tabela usuarios quando o usuário é atualizado no Auth
  UPDATE public.usuarios SET
    email = NEW.email,
    nome = COALESCE(NEW.raw_user_meta_data->>'nome', nome),
    role = COALESCE(NEW.raw_user_meta_data->>'role', role),
    regional = COALESCE(NEW.raw_user_meta_data->>'regional', regional),
    tipo = COALESCE(NEW.raw_user_meta_data->>'tipo', tipo),
    funcao = COALESCE(NEW.raw_user_meta_data->>'funcao', funcao),
    area = COALESCE(NEW.raw_user_meta_data->>'regional', area),
    updated_at = NOW()
  WHERE auth_user_id = NEW.id;

  -- Se o usuário não existe na tabela usuarios, criar
  IF NOT FOUND THEN
    INSERT INTO public.usuarios (
      auth_user_id,
      email,
      nome,
      role,
      regional,
      tipo,
      funcao,
      area,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
      NEW.raw_user_meta_data->>'regional',
      COALESCE(NEW.raw_user_meta_data->>'tipo', 'nacional'),
      NEW.raw_user_meta_data->>'funcao',
      NEW.raw_user_meta_data->>'regional',
      'ativo',
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função para marcar usuário como inativo quando deletado do Auth
CREATE OR REPLACE FUNCTION sync_user_on_auth_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Marcar usuário como inativo ao invés de deletar
  UPDATE public.usuarios SET
    status = 'inativo',
    updated_at = NOW()
  WHERE auth_user_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar triggers na tabela auth.users
-- NOTA: Estes triggers só funcionam se executados com privilégios de superusuário
-- No Supabase, pode ser necessário solicitar ao suporte para habilitar

-- Trigger para criação de usuário
DROP TRIGGER IF EXISTS trigger_sync_user_on_create ON auth.users;
CREATE TRIGGER trigger_sync_user_on_create
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_on_auth_create();

-- Trigger para atualização de usuário
DROP TRIGGER IF EXISTS trigger_sync_user_on_update ON auth.users;
CREATE TRIGGER trigger_sync_user_on_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_on_auth_update();

-- Trigger para deleção de usuário
DROP TRIGGER IF EXISTS trigger_sync_user_on_delete ON auth.users;
CREATE TRIGGER trigger_sync_user_on_delete
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_on_auth_delete();

-- 5. Função para sincronização manual (caso os triggers não funcionem)
CREATE OR REPLACE FUNCTION manual_sync_usuarios_with_auth()
RETURNS TEXT AS $$
DECLARE
  sync_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Sincronizar todos os usuários do Auth com a tabela usuarios
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data, created_at
    FROM auth.users
  LOOP
    INSERT INTO public.usuarios (
      auth_user_id,
      email,
      nome,
      role,
      regional,
      tipo,
      funcao,
      area,
      status,
      created_at,
      updated_at
    ) VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'nome', split_part(user_record.email, '@', 1)),
      COALESCE(user_record.raw_user_meta_data->>'role', 'user'),
      user_record.raw_user_meta_data->>'regional',
      COALESCE(user_record.raw_user_meta_data->>'tipo', 'nacional'),
      user_record.raw_user_meta_data->>'funcao',
      user_record.raw_user_meta_data->>'regional',
      'ativo',
      user_record.created_at,
      NOW()
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET
      email = EXCLUDED.email,
      nome = COALESCE(EXCLUDED.nome, usuarios.nome),
      role = COALESCE(EXCLUDED.role, usuarios.role),
      regional = COALESCE(EXCLUDED.regional, usuarios.regional),
      tipo = COALESCE(EXCLUDED.tipo, usuarios.tipo),
      funcao = COALESCE(EXCLUDED.funcao, usuarios.funcao),
      area = COALESCE(EXCLUDED.area, usuarios.area),
      updated_at = NOW();
    
    sync_count := sync_count + 1;
  END LOOP;

  RETURN 'Sincronização concluída. ' || sync_count || ' usuários processados.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Comentários e instruções
COMMENT ON FUNCTION sync_user_on_auth_create() IS 'Sincroniza usuário na tabela usuarios quando criado no Auth';
COMMENT ON FUNCTION sync_user_on_auth_update() IS 'Sincroniza usuário na tabela usuarios quando atualizado no Auth';
COMMENT ON FUNCTION sync_user_on_auth_delete() IS 'Marca usuário como inativo na tabela usuarios quando deletado do Auth';
COMMENT ON FUNCTION manual_sync_usuarios_with_auth() IS 'Função para sincronização manual de todos os usuários';

-- Instruções de uso:
-- 1. Execute este arquivo no Supabase Dashboard (SQL Editor)
-- 2. Se os triggers não funcionarem automaticamente, use: SELECT manual_sync_usuarios_with_auth();
-- 3. Para verificar se os triggers estão ativos: SELECT * FROM information_schema.triggers WHERE trigger_name LIKE 'trigger_sync_user%';