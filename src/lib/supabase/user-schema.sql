-- Drop the function if it exists with the old signature
DROP FUNCTION IF EXISTS public.get_all_users();

-- Recreate the get_all_users function with a robust fallback mechanism
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name') AS full_name,
        u.email,
        COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url') AS avatar_url,
        u.created_at
    FROM
        auth.users u
    LEFT JOIN
        public.profiles p ON u.id = p.id
    ORDER BY
        u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;


-- Function to get a single user's details
DROP FUNCTION IF EXISTS public.get_user_details(uuid);

CREATE OR REPLACE FUNCTION public.get_user_details(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
        u.email,
        COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url'),
        u.created_at
    FROM
        auth.users u
    LEFT JOIN
        public.profiles p ON u.id = p.id
    WHERE
        u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_details(uuid) TO authenticated;
