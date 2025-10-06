-- Fix RLS policies for calendar_events to use 'role' instead of 'funcao'
-- The current policy checks 'funcao' but should check 'role' or 'permissao'

-- Drop existing policies
DROP POLICY IF EXISTS "calendar_events_insert_policy" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_update_policy" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_delete_policy" ON calendar_events;

-- Create new policies using 'role' field
CREATE POLICY "calendar_events_insert_policy" ON calendar_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "calendar_events_update_policy" ON calendar_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "calendar_events_delete_policy" ON calendar_events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('super_admin', 'admin')
        )
    );

-- Note: The select policy should remain unchanged as it might have different permissions