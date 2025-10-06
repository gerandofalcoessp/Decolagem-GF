-- Migration: Fix infinite recursion in usuarios RLS policies
-- Date: 2025-01-21
-- Description: Remove recursive policies that cause infinite recursion when checking admin roles

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all users" ON usuarios;
DROP POLICY IF EXISTS "Admins can manage all users" ON usuarios;

-- Keep the basic policies that don't cause recursion
-- Users can view their own data (already exists)
-- Users can update their own data (already exists)
-- System can insert users (already exists)

-- Create a simple admin policy using auth.jwt() claims instead of table lookup
-- This avoids the infinite recursion by using JWT claims instead of querying the usuarios table
CREATE POLICY "Admins can view all users via JWT" ON usuarios
    FOR SELECT USING (
        (auth.jwt() ->> 'role')::text IN ('admin', 'super_admin')
        OR auth_user_id = auth.uid()
    );

CREATE POLICY "Admins can manage all users via JWT" ON usuarios
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text IN ('admin', 'super_admin')
        OR auth_user_id = auth.uid()
    );

-- Alternative: If JWT claims are not available, we can create a simpler approach
-- that allows authenticated users to read all usuarios but only update their own
-- This is less secure but avoids the infinite recursion

-- Uncomment these if the JWT approach doesn't work:
-- DROP POLICY IF EXISTS "Admins can view all users via JWT" ON usuarios;
-- DROP POLICY IF EXISTS "Admins can manage all users via JWT" ON usuarios;
-- 
-- CREATE POLICY "Authenticated users can view all users" ON usuarios
--     FOR SELECT USING (auth.uid() IS NOT NULL);
-- 
-- CREATE POLICY "Users can only manage their own data" ON usuarios
--     FOR UPDATE USING (auth_user_id = auth.uid());
-- 
-- CREATE POLICY "Users can only delete their own data" ON usuarios
--     FOR DELETE USING (auth_user_id = auth.uid());