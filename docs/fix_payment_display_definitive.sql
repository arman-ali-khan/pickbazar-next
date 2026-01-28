-- Add missing columns to the orders table if they don't exist.
ALTER TABLE "public"."orders"
ADD COLUMN IF NOT EXISTS "payment_method" text,
ADD COLUMN IF NOT EXISTS "payment_details" jsonb;

-- Drop the old function to avoid signature conflicts.
DROP FUNCTION IF EXISTS get_admin_order_details(text);

-- Create the new, corrected function to fetch order details.
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount double precision,
    status order_status,
    shipping_details jsonb,
    profiles json,
    order_items json,
    coupon_code text,
    discount_amount double precision,
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
        json_build_object(
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ) as profiles,
        (
            SELECT json_agg(
                json_build_object(
                    'id', oi.id,
                    'quantity', oi.quantity,
                    'price_at_purchase', oi.price_at_purchase,
                    'products', json_build_object(
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
        o.payment_details AS transaction_details -- Alias column for frontend
    FROM
        orders o
    LEFT JOIN
        profiles p ON o.user_id = p.id
    WHERE
        o.order_number = p_order_number;
END;
$$ LANGUAGE plpgsql;
