-- Drop the old function to avoid conflicts
DROP FUNCTION IF EXISTS public.get_admin_order_list();

-- Recreate the function with the correct return type and query structure
CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE(
    id integer,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status text,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function joins orders with profiles and auth.users to get customer details.
    -- It is intended for use in the admin dashboard.
    -- SECURITY DEFINER is used to bypass RLS for this specific admin query.
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status::text,
        p.full_name as customer_name,
        u.email as customer_email,
        p.avatar_url as customer_avatar_url
    FROM
        public.orders AS o
    LEFT JOIN
        public.profiles AS p ON o.user_id = p.id
    LEFT JOIN
        auth.users AS u ON o.user_id = u.id
    ORDER BY
        o.created_at DESC;
END;
$$;
