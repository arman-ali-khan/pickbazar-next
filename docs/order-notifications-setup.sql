-- This script fixes the get_admin_order_list function.
-- Please replace the existing content of the function with this new version.

CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        p.full_name AS customer_name,
        u.email AS customer_email,
        p.avatar_url AS customer_avatar_url
    FROM
        public.orders AS o
    LEFT JOIN
        public.profiles AS p ON o.user_id = p.id
    LEFT JOIN
        auth.users AS u ON o.user_id = u.id
    ORDER BY
        o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant execute permission
GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO authenticated;
