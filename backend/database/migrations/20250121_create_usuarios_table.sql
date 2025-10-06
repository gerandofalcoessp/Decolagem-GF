-- Migration: Create usuarios table
-- Description: Creates a dedicated usuarios table to centralize user data
-- Date: 2025-01-21

-- Create usuarios table
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  funcao VARCHAR(100),
  area VARCHAR(100),
  regional VARCHAR(100),
  tipo VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON usuarios(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_funcao ON usuarios(funcao);
CREATE INDEX IF NOT EXISTS idx_usuarios_area ON usuarios(area);
CREATE INDEX IF NOT EXISTS idx_usuarios_regional ON usuarios(regional);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE usuarios IS 'Tabela centralizada para dados dos usuários do sistema';
COMMENT ON COLUMN usuarios.auth_user_id IS 'Referência ao usuário no Supabase Auth';
COMMENT ON COLUMN usuarios.nome IS 'Nome completo do usuário';
COMMENT ON COLUMN usuarios.email IS 'Email único do usuário';
COMMENT ON COLUMN usuarios.funcao IS 'Função/cargo do usuário na organização';
COMMENT ON COLUMN usuarios.area IS 'Área de atuação do usuário';
COMMENT ON COLUMN usuarios.regional IS 'Regional de atuação do usuário';
COMMENT ON COLUMN usuarios.tipo IS 'Tipo de usuário (Nacional, Regional, etc.)';
COMMENT ON COLUMN usuarios.role IS 'Papel do usuário no sistema (user, admin, super_admin)';
COMMENT ON COLUMN usuarios.status IS 'Status do usuário (ativo, inativo, suspenso)';

-- Enable RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for users to see their own data
CREATE POLICY "Users can view own data" ON usuarios
    FOR SELECT USING (auth_user_id = auth.uid());

-- Policy for users to update their own data
CREATE POLICY "Users can update own data" ON usuarios
    FOR UPDATE USING (auth_user_id = auth.uid());

-- Policy for admins to see all users
CREATE POLICY "Admins can view all users" ON usuarios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Policy for admins to manage all users
CREATE POLICY "Admins can manage all users" ON usuarios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Policy for system to insert new users (during registration)
CREATE POLICY "System can insert users" ON usuarios
    FOR INSERT WITH CHECK (true);