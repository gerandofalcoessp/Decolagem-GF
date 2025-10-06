-- Migration: Allow multiple members per user
-- Date: 2025-01-20
-- Description: Remove unique constraint on auth_user_id to allow multiple members per user

-- Remove the unique constraint on auth_user_id
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_auth_user_id_key;

-- Drop the unique index if it exists
DROP INDEX IF EXISTS idx_members_auth_user_id;

-- Create a non-unique index for performance on auth_user_id lookups
CREATE INDEX IF NOT EXISTS idx_members_auth_user_id_non_unique ON public.members(auth_user_id);

-- Update RLS policies to handle multiple members per user
-- Drop existing policy
DROP POLICY IF EXISTS members_insert_self ON public.members;

-- Create new policy that allows users to insert multiple members for themselves
CREATE POLICY members_insert_self ON public.members
  FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- Update select policy to be more flexible (if needed)
DROP POLICY IF EXISTS members_select_own ON public.members;
CREATE POLICY members_select_own ON public.members
  FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Update update policy (if needed)
DROP POLICY IF EXISTS members_update_own ON public.members;
CREATE POLICY members_update_own ON public.members
  FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Update delete policy (if needed)
DROP POLICY IF EXISTS members_delete_own ON public.members;
CREATE POLICY members_delete_own ON public.members
  FOR DELETE
  USING (auth.uid() = auth_user_id);

-- Add a comment to document the change
COMMENT ON TABLE public.members IS 'Members table - allows multiple members per auth user as of 2025-01-20';