-- Migration: Add funcao and area columns to members table
-- Date: 2025-01-20
-- Description: Add funcao (role/function) and area (area/department) columns to members table

-- Add funcao column (role/function)
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS funcao text;

-- Add area column (area/department) 
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS area text;

-- Create indexes for better performance on filtering
CREATE INDEX IF NOT EXISTS idx_members_funcao ON public.members(funcao);
CREATE INDEX IF NOT EXISTS idx_members_area ON public.members(area);

-- Add comments to document the new columns
COMMENT ON COLUMN public.members.funcao IS 'Member role/function (e.g., Coordenador, Analista, etc.)';
COMMENT ON COLUMN public.members.area IS 'Member area/department (e.g., Operações, Administrativo, etc.)';