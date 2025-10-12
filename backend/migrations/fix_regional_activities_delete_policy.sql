-- Migration: Add DELETE policy for regional_activities table
-- Date: 2025-01-25
-- Description: Fix missing DELETE policy that prevents users from deleting regional activities

-- Add DELETE policy for regional_activities
CREATE POLICY "regional_activities_delete_policy" ON regional_activities
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM members m 
            WHERE m.id = regional_activities.member_id 
            AND m.auth_user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.funcao IN ('super_admin', 'equipe_interna')
        )
    );