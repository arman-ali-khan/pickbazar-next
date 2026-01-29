-- This script corrects the return type of the get_admin_order_list function.
-- The created_at column was being incorrectly cast to text, causing comparison errors.
-- This script changes the return type to timestamp with time zone.

DROP FUNCTION IF EXISTS public.get_admin_order_list();

CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount double precision,
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
        p.full_name as customer_name,
        u.email as customer_email,
        p.avatar_url as customer_avatar_url
    FROM
        public.orders o
    LEFT JOIN
        auth.users u ON o.user_id = u.id
    LEFT JOIN
        public.profiles p ON o.user_id = p.id
    ORDER BY
        o.created_at DESC;
END;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO authenticated;
-- Grant execute permission to the service_role for server-side calls
GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO service_role;
