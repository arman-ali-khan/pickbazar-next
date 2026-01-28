-- This script fixes the "structure of query does not match function result type" error
-- for the get_admin_order_details function by first dropping the old function
-- before creating the new, corrected version.

DROP FUNCTION IF EXISTS get_admin_order_details(text);

CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id int,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status order_status,
    shipping_details jsonb,
    profiles jsonb,
    order_items json,
    coupon_code text,
    discount_amount numeric,
    payment_method text,
    payment_details jsonb
)
LANGUAGE sql
STABLE
AS $$
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
    o.payment_details
FROM
    orders o
LEFT JOIN
    profiles p ON o.user_id = p.id
WHERE
    o.order_number = p_order_number;
$$;