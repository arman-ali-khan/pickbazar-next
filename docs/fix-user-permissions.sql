-- This script fixes "permission denied" errors by creating a secure VIEW
-- to access non-sensitive user data from the auth.users table.

-- 1. Create a view to securely expose necessary user data.
CREATE OR REPLACE VIEW public.users_view AS
SELECT id, email, created_at
FROM auth.users;

-- 2. Grant SELECT permission on the new view to authenticated users.
-- This allows your database functions to read from this view.
GRANT SELECT ON public.users_view TO authenticated;
GRANT SELECT ON public.users_view TO service_role;

-- 3. Drop old functions to ensure a clean update.
DROP FUNCTION IF EXISTS get_admins();
DROP FUNCTION IF EXISTS get_potential_admins();
DROP FUNCTION IF EXISTS get_all_users();
DROP FUNCTION IF EXISTS get_user_details(UUID);

-- 4. Recreate the get_admins function to use the new view.
CREATE OR REPLACE FUNCTION get_admins()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        u.email,
        p.avatar_url,
        p.role::text
    FROM public.profiles p
    JOIN public.users_view u ON p.id = u.id
    WHERE p.role::text IN ('admin', 'manager', 'super-admin')
    ORDER BY p.role::text, p.full_name;
END;
$$;

-- 5. Recreate the get_potential_admins function to use the new view.
CREATE OR REPLACE FUNCTION get_potential_admins()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        u.email,
        p.avatar_url
    FROM public.profiles p
    JOIN public.users_view u ON p.id = u.id
    WHERE p.role = 'customer'
    ORDER BY p.full_name;
END;
$$;

-- 6. Recreate the get_all_users function to use the new view.
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        u.email,
        p.avatar_url,
        u.created_at
    FROM public.profiles p
    JOIN public.users_view u ON p.id = u.id
    ORDER BY u.created_at DESC;
END;
$$;

-- 7. Recreate the get_user_details function to use the new view.
CREATE OR REPLACE FUNCTION get_user_details(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        u.email,
        p.avatar_url
    FROM public.profiles p
    JOIN public.users_view u ON p.id = u.id
    WHERE p.id = p_user_id;
END;
$$;
