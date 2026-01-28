-- This script provides a definitive fix for the admin order details page errors.

BEGIN;

-- Step 1: Ensure the necessary columns exist on the 'orders' table.
-- This prevents "column does not exist" errors.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_details jsonb;

-- Step 2: Drop the old function to avoid any conflicts with return types.
DROP FUNCTION IF EXISTS get_admin_order_details(text);

-- Step 3: Create the new, corrected function for fetching admin order details.
-- This version handles NULLs gracefully for profiles and order_items,
-- preventing "structure of query does not match function result type" errors.
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount real,
    status order_status,
    shipping_details jsonb,
    profiles jsonb,
    order_items jsonb,
    coupon_code text,
    discount_amount real,
    payment_method text,
    transaction_details jsonb
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
        CASE
            WHEN p.id IS NOT NULL THEN jsonb_build_object(
                'full_name', p.full_name,
                'avatar_url', p.avatar_url
            )
            ELSE NULL
        END AS profiles,
        COALESCE(
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
            ),
            '[]'::jsonb
        ) AS order_items,
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.payment_details AS transaction_details
    FROM orders o
    LEFT JOIN profiles p ON o.user_id = p.id
    WHERE o.order_number = p_order_number;
END;
$$ LANGUAGE plpgsql;

COMMIT;
