-- First, drop the old function to ensure we're starting fresh.
DROP FUNCTION IF EXISTS get_admin_order_list();

-- Create the new, corrected function
-- This function runs with the permissions of the owner, allowing it to join tables
-- that the calling user might not have direct access to.
CREATE OR REPLACE FUNCTION get_admin_order_list()
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status order_status,
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
        o.shipping_details->>'firstName' || ' ' || o.shipping_details->>'lastName' as customer_name,
        o.shipping_details->>'email' as customer_email,
        p.avatar_url as customer_avatar_url
    FROM
        public.orders AS o
    LEFT JOIN
        public.profiles AS p ON o.user_id = p.id
    ORDER BY
        o.created_at DESC;
END;
$$;
