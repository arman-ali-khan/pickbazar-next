
-- This script fixes an error where the return type of the get_admins function
-- does not match the actual structure of the query result.
-- This can happen if the 'role' column in the 'profiles' table is of type TEXT
-- while the function expects a custom 'app_role' type.
-- This fix makes the function more robust by casting the role to TEXT.

-- First, drop the existing function to ensure a clean replacement.
DROP FUNCTION IF EXISTS get_admins();

-- Then, re-create the function with the corrected return type for the role.
CREATE OR REPLACE FUNCTION get_admins()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT -- Ensure the role is returned as TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This security check is now correctly handled by RLS policies,
    -- but we can keep it as an extra layer of defense.
    IF (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) NOT IN ('super-admin', 'admin', 'manager') THEN
        RAISE EXCEPTION 'You do not have permission to view admins.';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        u.email,
        p.avatar_url,
        p.role::TEXT -- Explicitly cast the role to TEXT
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.role IN ('admin', 'manager', 'super-admin')
    ORDER BY p.role, p.full_name;
END;
$$;
