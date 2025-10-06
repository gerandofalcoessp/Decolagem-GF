-- Migration: Add missing fields to goals table
-- Date: 2025-01-21
-- Description: Add description, target_value, and current_value fields to goals table

BEGIN;

-- Add description column for storing goal details
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS description text;

-- Add target_value column for storing the goal target
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS target_value numeric DEFAULT 0;

-- Add current_value column for storing current progress
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS current_value numeric DEFAULT 0;

-- Add comments to document the new columns
COMMENT ON COLUMN public.goals.description IS 'Detailed description of the goal including months and regions';
COMMENT ON COLUMN public.goals.target_value IS 'Target value to be achieved for this goal';
COMMENT ON COLUMN public.goals.current_value IS 'Current progress value for this goal';

-- Create indexes for better performance on filtering by values
CREATE INDEX IF NOT EXISTS idx_goals_target_value ON public.goals(target_value);
CREATE INDEX IF NOT EXISTS idx_goals_current_value ON public.goals(current_value);

COMMIT;