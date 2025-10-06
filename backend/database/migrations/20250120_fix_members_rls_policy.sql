-- Migration: Fix members RLS policy to allow admin creation of members without auth_user_id
-- Date: 2025-01-20
-- Description: Update RLS policy to allow creation of members without auth_user_id (for admin use cases)

-- Drop existing insert policy
DROP POLICY IF EXISTS members_insert_self ON public.members;

-- Create new policy that allows:
-- 1. Users to create members for themselves (auth.uid() = auth_user_id)
-- 2. Authenticated users to create members without auth_user_id (admin functionality)
CREATE POLICY members_insert_flexible ON public.members
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Allow if auth_user_id matches current user (user creating for themselves)
    auth.uid() = auth_user_id 
    OR 
    -- Allow if auth_user_id is null (admin creating member for someone else)
    auth_user_id IS NULL
  );

-- Update select policy to handle null auth_user_id
DROP POLICY IF EXISTS members_select_own ON public.members;
CREATE POLICY members_select_flexible ON public.members
  FOR SELECT TO authenticated
  USING (
    -- Allow if auth_user_id matches current user
    auth.uid() = auth_user_id 
    OR 
    -- Allow if auth_user_id is null (these are admin-created members, visible to all authenticated users)
    auth_user_id IS NULL
  );

-- Update update policy to handle null auth_user_id
DROP POLICY IF EXISTS members_update_own ON public.members;
CREATE POLICY members_update_flexible ON public.members
  FOR UPDATE TO authenticated
  USING (
    -- Allow if auth_user_id matches current user
    auth.uid() = auth_user_id 
    OR 
    -- Allow if auth_user_id is null (admin-created members can be updated by any authenticated user)
    auth_user_id IS NULL
  )
  WITH CHECK (
    -- Maintain the same auth_user_id value or allow null
    (auth.uid() = auth_user_id OR auth_user_id IS NULL)
  );

-- Update delete policy to handle null auth_user_id
DROP POLICY IF EXISTS members_delete_own ON public.members;
CREATE POLICY members_delete_flexible ON public.members
  FOR DELETE TO authenticated
  USING (
    -- Allow if auth_user_id matches current user
    auth.uid() = auth_user_id 
    OR 
    -- Allow if auth_user_id is null (admin-created members can be deleted by any authenticated user)
    auth_user_id IS NULL
  );

-- Add comment to document the change
COMMENT ON TABLE public.members IS 'Members table - allows user-owned members and admin-created members (auth_user_id can be null) as of 2025-01-20';