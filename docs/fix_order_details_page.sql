-- First, drop the existing, broken function to avoid conflicts.
DROP FUNCTION IF EXISTS get_admin_order_details(p_order_number text);

-- Then, re-create it with the correct structure.
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status order_status,
    shipping_details jsonb,
    profiles jsonb,
    order_items jsonb[],
    coupon_code text,
    discount_amount numeric,
    payment_method text,
    transaction_details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This sets the search path to public to ensure the function can find tables.
    SET search_path = public;
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
        array_agg(
            jsonb_build_object(
                'id', oi.id,
                'quantity', oi.quantity,
                'price_at_purchase', oi.price,
                'products', jsonb_build_object(
                    'name', pr.name,
                    'featured_image_url', pr.featured_image_url
                )
            )
        ) as order_items,
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.transaction_details
    FROM
        orders o
    LEFT JOIN
        profiles p ON o.user_id = p.id
    JOIN
        order_items oi ON o.id = oi.order_id
    JOIN
        products pr ON oi.product_id = pr.id
    WHERE
        o.order_number = p_order_number
    GROUP BY
        o.id, p.full_name, p.avatar_url;
END;
$$;
