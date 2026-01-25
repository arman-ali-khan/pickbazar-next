-- This function fetches all details for a single order for the admin dashboard.
-- It is a SECURITY DEFINER function, so it bypasses RLS and can see all data.
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_details jsonb;
BEGIN
    SELECT
        jsonb_build_object(
            'id', o.id,
            'order_number', o.order_number,
            'created_at', o.created_at,
            'total_amount', o.total_amount,
            'status', o.status,
            'shipping_details', o.shipping_details,
            'profiles', jsonb_build_object(
                'full_name', p.full_name,
                'avatar_url', p.avatar_url
            ),
            'order_items', (
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
                FROM public.order_items oi
                LEFT JOIN public.products pr ON oi.product_id = pr.id
                WHERE oi.order_id = o.id
            )
        )
    INTO order_details
    FROM public.orders o
    LEFT JOIN public.profiles p ON o.user_id = p.id
    WHERE o.order_number = p_order_number;

    RETURN order_details;
END;
$$;
