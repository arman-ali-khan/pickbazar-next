-- Drop the existing function to ensure a clean replacement
DROP FUNCTION IF EXISTS public.get_admin_transactions();

-- Recreate the function with the correct logic
CREATE OR REPLACE FUNCTION public.get_admin_transactions()
RETURNS TABLE (
    id bigint,
    order_id bigint,
    order_number text,
    customer_name text,
    customer_avatar text,
    amount numeric,
    payment_method text,
    status text,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.order_id,
        o.order_number,
        COALESCE(p.full_name, (o.shipping_details->>'firstName' || ' ' || o.shipping_details->>'lastName')) AS customer_name,
        p.avatar_url AS customer_avatar,
        t.amount,
        t.payment_method,
        t.status::text,
        t.created_at
    FROM
        public.transactions t
    JOIN
        public.orders o ON t.order_id = o.id
    LEFT JOIN
        public.profiles p ON o.user_id = p.id
    ORDER BY
        t.created_at DESC;
END;
$$;
