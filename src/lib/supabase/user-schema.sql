-- Drop the function if it exists to ensure a clean re-creation
DROP FUNCTION IF EXISTS public.get_all_users();

-- Create the function to get all users by joining with the profiles table
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        p.full_name,
        p.avatar_url,
        u.email,
        u.created_at
    FROM auth.users AS u
    LEFT JOIN public.profiles AS p ON u.id = p.id
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the function to authenticated users
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
