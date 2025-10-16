-- Migration: Add regionais_nps column to regional_activities table
-- Date: 2025-01-24
-- Description: Add regionais_nps JSONB column to store NPS regional selections

-- Add regionais_nps column for storing NPS regional selections as JSON
ALTER TABLE public.regional_activities ADD COLUMN IF NOT EXISTS regionais_nps JSONB DEFAULT NULL;

-- Add comment to document the new column
COMMENT ON COLUMN public.regional_activities.regionais_nps IS 'JSON array storing NPS regional selections for national activities';

-- Create index for better performance on filtering by regionais_nps
CREATE INDEX IF NOT EXISTS idx_regional_activities_regionais_nps ON public.regional_activities USING GIN (regionais_nps);