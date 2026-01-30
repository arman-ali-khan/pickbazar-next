
-- This script fixes the 'get_all_users' function by ensuring the returned columns match the expected types.

-- Drop the existing function if it exists to avoid conflicts.
DROP FUNCTION IF EXISTS public.get_all_users();

-- Recreate the function with correct type casting.
-- The error "Returned type character varying(255) does not match expected type text in column 2"
-- indicates that the 'full_name' column from the 'profiles' table is of type character varying(255),
-- but the function is defined to return TEXT. Casting it to TEXT resolves this mismatch.
-- Similarly, casting 'role' and `avatar_url` to TEXT prevents potential future issues if their types change.
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    created_at timestamptz,
    role text
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        u.id,
        p.full_name::text,
        u.email,
        p.avatar_url::text,
        u.created_at,
        p.role::text
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id;
$$;

