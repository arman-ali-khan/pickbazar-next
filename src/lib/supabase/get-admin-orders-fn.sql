DROP FUNCTION IF EXISTS get_admin_orders();

CREATE OR REPLACE FUNCTION get_admin_orders()
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status order_status,
    shipping_details jsonb,
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
        o.shipping_details,
        p.avatar_url AS customer_avatar_url
    FROM
        public.orders o
    LEFT JOIN
        public.profiles p ON o.user_id = p.id
    ORDER BY
        o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
