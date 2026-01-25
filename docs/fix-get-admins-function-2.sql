-- Drop the old function to be safe
DROP FUNCTION IF EXISTS get_admins();

-- Recreate the function ensuring the return type for 'role' is TEXT
CREATE OR REPLACE FUNCTION get_admins()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT -- Changed from app_role to TEXT for safety
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the calling user is a super-admin.
    -- We cast the role to text for a reliable string comparison.
    IF (SELECT p.role::text FROM public.profiles p WHERE p.id = auth.uid()) <> 'super-admin' THEN
        RAISE EXCEPTION 'Only super-admins can view the list of admins.';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        u.email,
        p.avatar_url,
        p.role::text -- Explicitly cast role to TEXT
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.role::text IN ('admin', 'manager', 'super-admin')
    ORDER BY p.role::text, p.full_name;
END;
$$;
