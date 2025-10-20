-- Script para criar índices otimizados baseado nas queries mais frequentes
-- Este script melhora a performance das consultas mais comuns do sistema

-- Índices para a tabela regional_activities (baseado nas queries frequentes)
CREATE INDEX IF NOT EXISTS idx_regional_activities_member_id 
ON regional_activities(member_id);

CREATE INDEX IF NOT EXISTS idx_regional_activities_responsavel_id 
ON regional_activities(responsavel_id);

CREATE INDEX IF NOT EXISTS idx_regional_activities_created_at 
ON regional_activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_regional_activities_member_created 
ON regional_activities(member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_regional_activities_regional_status 
ON regional_activities(regional, status);

-- Índices para a tabela instituicoes (baseado nas verificações de metadados)
CREATE INDEX IF NOT EXISTS idx_instituicoes_active 
ON instituicoes(active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_instituicoes_name 
ON instituicoes(name) WHERE name IS NOT NULL;

-- Índices para a tabela goals (baseado nas verificações de metadados)
CREATE INDEX IF NOT EXISTS idx_goals_member_id 
ON goals(member_id);

CREATE INDEX IF NOT EXISTS idx_goals_status 
ON goals(status);

CREATE INDEX IF NOT EXISTS idx_goals_member_status 
ON goals(member_id, status);

CREATE INDEX IF NOT EXISTS idx_goals_created_at 
ON goals(created_at DESC);

-- Índices para a tabela usuarios (baseado nas verificações de metadados)
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id 
ON usuarios(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_email 
ON usuarios(email) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_status 
ON usuarios(status) WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_regional 
ON usuarios(regional);

-- Índices para a tabela members (baseado nas verificações de metadados)
CREATE INDEX IF NOT EXISTS idx_members_auth_user_id 
ON members(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_members_email 
ON members(email);

CREATE INDEX IF NOT EXISTS idx_members_regional 
ON members(regional);

CREATE INDEX IF NOT EXISTS idx_members_auth_regional 
ON members(auth_user_id, regional);

-- Índices compostos para queries complexas comuns
CREATE INDEX IF NOT EXISTS idx_regional_activities_complex 
ON regional_activities(member_id, created_at DESC, id) 
WHERE member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_goals_complex 
ON goals(member_id, status, created_at DESC) 
WHERE member_id IS NOT NULL AND status IS NOT NULL;

-- Índices para otimizar JOINs frequentes
CREATE INDEX IF NOT EXISTS idx_members_join_optimization 
ON members(auth_user_id, regional, created_at DESC);

-- Comentários sobre os índices criados
COMMENT ON INDEX idx_regional_activities_member_id IS 'Otimiza queries por membro na tabela regional_activities';
COMMENT ON INDEX idx_regional_activities_responsavel_id IS 'Otimiza queries por responsável na tabela regional_activities';
COMMENT ON INDEX idx_regional_activities_created_at IS 'Otimiza ordenação por data de criação';
COMMENT ON INDEX idx_regional_activities_member_created IS 'Índice composto para queries por membro ordenadas por data';
COMMENT ON INDEX idx_goals_member_status IS 'Otimiza queries por membro e status nas metas';
COMMENT ON INDEX idx_members_auth_regional IS 'Otimiza queries de membros por usuário e regional';

-- Análise das tabelas após criação dos índices (executar separadamente se necessário)
-- ANALYZE regional_activities;
-- ANALYZE instituicoes;
-- ANALYZE goals;
-- ANALYZE usuarios;
-- ANALYZE members;