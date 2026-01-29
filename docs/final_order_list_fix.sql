-- Drops the old, broken function if it exists
DROP FUNCTION IF EXISTS public.get_admin_order_list();

-- Re-creates the function with the CORRECT return types to match the table schema
CREATE OR REPLACE FUNCTION public.get_admin_order_list()
 RETURNS TABLE(
    id bigint, 
    order_number text, 
    created_at timestamp with time zone, 
    total_amount numeric, 
    status public.order_status, 
    customer_name text, 
    customer_email text, 
    customer_avatar_url text
)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
        public.orders o
    LEFT JOIN
        public.profiles p ON o.user_id = p.id
    LEFT JOIN
        auth.users u ON o.user_id = u.id
    ORDER BY
        o.created_at DESC;
END;
$function$;
