-- This script fixes an error on the admin order list page by correcting the
-- return type of the `get_admin_order_list` function. The `created_at`
-- column was incorrectly being returned as `text` instead of `timestamptz`.

-- Drop the old function to avoid signature conflicts.
DROP FUNCTION IF EXISTS public.get_admin_order_list();

-- Recreate the function with the correct return types.
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
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        (o.shipping_details->>'firstName' || ' ' || o.shipping_details->>'lastName') as customer_name,
        o.shipping_details->>'email' as customer_email,
        p.avatar_url as customer_avatar_url
    FROM
        orders o
    LEFT JOIN
        profiles p ON o.user_id = p.id
    ORDER BY
        o.created_at DESC;
END;
$$;
