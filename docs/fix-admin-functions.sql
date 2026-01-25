-- This script corrects and defines database functions for the admin dashboard.

-- Drop existing functions to ensure a clean slate
DROP FUNCTION IF EXISTS get_admins();
DROP FUNCTION IF EXISTS get_potential_admins();
DROP FUNCTION IF EXISTS get_admin_reviews();

-- 1. Recreate the get_admins function
-- This function retrieves users with admin, manager, or super-admin roles.
-- The explicit casting of `role` to TEXT resolves potential type mismatches.
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
    JOIN auth.users u ON p.id = u.id
    WHERE p.role::text IN ('admin', 'manager', 'super-admin')
    ORDER BY p.role::text, p.full_name;
END;
$$;

-- 2. Recreate the get_potential_admins function
-- This function retrieves users with the 'customer' role who can be promoted.
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
    JOIN auth.users u ON p.id = u.id
    WHERE p.role = 'customer'
    ORDER BY p.full_name;
END;
$$;

-- 3. Create the get_admin_reviews function
-- This function is used on the main dashboard and the reviews page.
-- It returns nested JSON objects for 'author' and 'product' to match the frontend types.
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
        json_build_object(
            'name', p.full_name,
            'avatar_url', p.avatar_url
        ) AS author,
        json_build_object(
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
