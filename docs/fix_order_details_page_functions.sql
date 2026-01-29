
DROP FUNCTION IF EXISTS get_admin_order_details(text);
DROP FUNCTION IF EXISTS get_order_history(integer);

CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id int,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status order_status,
    user_id uuid,
    shipping_details jsonb,
    profiles jsonb,
    order_items jsonb,
    coupon_code text,
    discount_amount numeric,
    payment_method text,
    transaction_details jsonb
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        o.user_id,
        o.shipping_details,
        jsonb_build_object(
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ) AS profiles,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', oi.id,
                    'quantity', oi.quantity,
                    'price_at_purchase', oi.price, -- Aliasing `price` column to `price_at_purchase`
                    'products', jsonb_build_object(
                        'name', pr.name,
                        'featured_image_url', pr.featured_image_url
                    )
                )
            )
            FROM order_items oi
            JOIN products pr ON oi.product_id = pr.id
            WHERE oi.order_id = o.id
        ) AS order_items,
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.payment_details AS transaction_details
    FROM
        orders o
    LEFT JOIN
        profiles p ON o.user_id = p.id
    WHERE
        o.order_number = p_order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_order_history(p_order_id int)
RETURNS TABLE (
    status text,
    created_at timestamptz
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        oh.status,
        oh.created_at
    FROM
        order_history oh
    WHERE
        oh.order_id = p_order_id
    ORDER BY
        oh.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

    