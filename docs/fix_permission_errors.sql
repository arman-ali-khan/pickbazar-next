-- This script fixes the "permission denied for table users" error
-- by allowing specific functions to securely access user data.

-- Drop the old, faulty function if it exists to avoid conflicts.
DROP FUNCTION IF EXISTS get_admin_order_list();

-- Recreate the function to get the order list with secure permissions.
CREATE OR REPLACE FUNCTION get_admin_order_list()
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount numeric,
    status order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER -- Allows the function to run with the permissions of the user who created it.
AS $$
BEGIN
    -- Explicitly set the search path to be secure
    SET search_path = public;

    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        -- Fallback to user metadata if profile name is null
        COALESCE(p.full_name, u.raw_user_meta_data->>'full_name') AS customer_name,
        u.email AS customer_email,
        COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url') AS customer_avatar_url
    FROM
        orders AS o
    LEFT JOIN
        auth.users AS u ON o.user_id = u.id
    LEFT JOIN
        public.profiles AS p ON o.user_id = p.id
    ORDER BY
        o.created_at DESC;
END;
$$;

-- Proactively fix the function for getting all users to prevent the same error on the users page.
-- Drop the old function if it exists.
DROP FUNCTION IF EXISTS get_all_users();

-- Recreate the function to get all users with secure permissions.
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamptz,
    role user_role
)
LANGUAGE plpgsql
SECURITY DEFINER -- Allows the function to run with the permissions of the user who created it.
AS $$
BEGIN
    SET search_path = public;

    RETURN QUERY
    SELECT
        u.id,
        u.email,
        p.full_name,
        p.avatar_url,
        u.created_at,
        p.role
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    ORDER BY u.created_at DESC;
END;
$$;
