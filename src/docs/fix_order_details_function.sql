-- This script fixes the "column o.payment_method does not exist" and "structure of query does not match function result type" errors on the admin order details page.
-- It is safe to run this script multiple times.

-- 1. Add missing columns to the orders table if they don't already exist.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_details jsonb;

-- 2. Drop the old function to prevent errors when changing its return type.
DROP FUNCTION IF EXISTS get_admin_order_details(text);

-- 3. Create the function with the correct columns and return types.
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE(
    id int,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status order_status,
    shipping_details jsonb,
    profiles jsonb,
    order_items jsonb,
    coupon_code text,
    discount_amount numeric,
    payment_method text,
    transaction_details jsonb -- Mapped to payment_details column for use in the front-end component
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
        jsonb_build_object(
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ) as profiles,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', oi.id,
                    'quantity', oi.quantity,
                    'price_at_purchase', oi.price_at_purchase,
                    'products', jsonb_build_object(
                        'name', pr.name,
                        'featured_image_url', pr.featured_image_url
                    )
                )
            )
            FROM order_items oi
            JOIN products pr ON oi.product_id = pr.id
            WHERE oi.order_id = o.id
        ) as order_items,
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.payment_details as transaction_details
    FROM orders o
    LEFT JOIN profiles p ON o.user_id = p.id
    WHERE o.order_number = p_order_number;
END;
$$ LANGUAGE plpgsql;
