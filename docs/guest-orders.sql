
-- This function retrieves all orders placed by guest users (where user_id is NULL).
-- It's designed to be used in the admin dashboard to specifically track non-user purchases.
CREATE OR REPLACE FUNCTION get_guest_orders()
RETURNS TABLE (
    id BIGINT,
    order_number TEXT,
    created_at TIMESTAMPTZ,
    total_amount DECIMAL,
    status order_status,
    shipping_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Ensure the user calling this function has admin privileges.
    IF NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only administrators can view guest orders.';
    END IF;

    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        o.shipping_details
    FROM
        orders o
    WHERE
        o.user_id IS NULL
    ORDER BY
        o.created_at DESC;
END;
$$;
