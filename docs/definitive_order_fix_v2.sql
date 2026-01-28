-- This script definitively fixes the "structure of query does not match function result type" error
-- by correcting the data types in the get_admin_order_details function definition.

-- It is safe to run this script multiple times.

-- 1. Drop the old, incorrect function to avoid conflicts.
DROP FUNCTION IF EXISTS public.get_admin_order_details(text);

-- 2. Create the corrected function with the right return types (jsonb for appropriate columns).
CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount numeric,
    status public.order_status,
    shipping_details jsonb, -- Corrected type
    profiles json,
    order_items json,
    coupon_code text,
    discount_amount numeric,
    payment_method text,
    transaction_details jsonb -- Corrected type
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
            FROM public.order_items oi
            JOIN public.products pr ON oi.product_id = pr.id
            WHERE oi.order_id = o.id
        ) as order_items,
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.payment_details as transaction_details
    FROM
        public.orders o
    LEFT JOIN
        public.profiles p ON o.user_id = p.id
    WHERE
        o.order_number = p_order_number;
END;
$$;
