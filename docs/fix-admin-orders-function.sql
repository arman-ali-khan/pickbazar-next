-- This script fixes the get_admin_order_list function by correcting the return type of the 'id' column.

-- Drop the old, incorrect function if it exists
DROP FUNCTION IF EXISTS public.get_admin_order_list();

-- Create the function with the corrected return type for 'id' (bigint instead of int)
CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status public.order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        p.full_name,
        u.email,
        p.avatar_url
    FROM
        public.orders AS o
    JOIN
        auth.users AS u ON o.user_id = u.id
    LEFT JOIN
        public.profiles AS p ON u.id = p.id
    ORDER BY
        o.created_at DESC;
END;
$$;
