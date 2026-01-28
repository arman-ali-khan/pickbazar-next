-- This script provides a definitive fix for the admin order details page errors.

-- Step 1: Safely add the required payment columns to the 'orders' table if they don't already exist.
-- This prevents "column already exists" errors on subsequent runs.
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'orders'::regclass AND attname = 'payment_method') THEN
        ALTER TABLE "public"."orders" ADD COLUMN "payment_method" text;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'orders'::regclass AND attname = 'payment_details') THEN
        ALTER TABLE "public"."orders" ADD COLUMN "payment_details" jsonb;
    END IF;
END $$;


-- Step 2: Drop the old, faulty function to prevent any conflicts with the new version.
DROP FUNCTION IF EXISTS get_admin_order_details(text);

-- Step 3: Create the new, corrected function to get detailed order information for admins.
-- This version correctly handles null values and has a structure that matches the application's expectations.
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE (
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
    transaction_details jsonb
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
        o.shipping_details,
        jsonb_build_object(
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ),
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
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.payment_details AS transaction_details -- Alias to match frontend expectation
    FROM orders o
    LEFT JOIN profiles p ON o.user_id = p.id
    WHERE o.order_number = p_order_number;
END;
$$;
