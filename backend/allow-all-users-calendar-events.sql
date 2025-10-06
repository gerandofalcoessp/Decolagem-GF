-- Allow any authenticated user to create, update, and delete calendar events
-- This removes the restriction that only super_admin/admin can manage calendar events

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "calendar_events_insert_policy" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_update_policy" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_delete_policy" ON calendar_events;

-- Create new policies that allow any authenticated user
CREATE POLICY "calendar_events_insert_policy" ON calendar_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "calendar_events_update_policy" ON calendar_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "calendar_events_delete_policy" ON calendar_events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.auth_user_id = auth.uid()
        )
    );

-- Note: This allows any user in the usuarios table to manage calendar events