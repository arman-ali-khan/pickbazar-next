-- This is a comprehensive script to fix all admin-related database functions.
-- It ensures correct data types and permissions to resolve "structure does not match" errors.

-- 1. Drop old functions and view to ensure a clean state.
DROP FUNCTION IF EXISTS get_admins();
DROP FUNCTION IF EXISTS get_all_users();
DROP FUNCTION IF EXISTS get_admin_reviews();
DROP FUNCTION IF EXISTS get_potential_admins();
DROP VIEW IF EXISTS public.users_public;


-- 2. Create a secure view for the auth.users table
CREATE VIEW public.users_public AS
    SELECT id, email, created_at FROM auth.users;

-- 3. Grant usage to the public view
-- This allows authenticated users (like your app's service role) to read from this view.
GRANT SELECT ON public.users_public TO authenticated;
GRANT SELECT ON public.users_public TO service_role;


-- 4. Recreate get_admins() function
-- Retrieves users with administrative roles.
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
    JOIN public.users_public u ON p.id = u.id
    WHERE p.role::text IN ('admin', 'manager', 'super-admin')
    ORDER BY p.role::text, p.full_name;
END;
$$;


-- 5. Recreate get_all_users() function
-- Retrieves all users for the main user management page.
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
    JOIN public.users_public u ON p.id = u.id
    ORDER BY u.created_at DESC;
END;
$$;


-- 6. Recreate get_admin_reviews() function
-- Retrieves reviews for the admin dashboard and reviews page.
CREATE OR REPLACE FUNCTION get_admin_reviews()
RETURNS TABLE (
    id BIGINT,
    rating INT,
    text TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    author JSONB,
    product JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.rating,
        r.text,
        r.status,
        r.created_at,
        jsonb_build_object(
            'name', p.full_name,
            'avatar_url', p.avatar_url
        ) AS author,
        jsonb_build_object(
            'id', pr.id,
            'name', pr.name,
            'featured_image_url', pr.featured_image_url
        ) AS product
    FROM public.reviews r
    JOIN public.profiles p ON r.user_id = p.id
    JOIN public.products pr ON r.product_id = pr.id
    ORDER BY r.created_at DESC;
END;
$$;

-- 7. Recreate get_potential_admins() function
-- Retrieves non-admin users who can be promoted.
CREATE OR REPLACE FUNCTION get_potential_admins()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        u.email,
        p.avatar_url
    FROM public.profiles p
    JOIN public.users_public u ON p.id = u.id
    WHERE p.role = 'customer'
    ORDER BY p.full_name;
END;
$$;
