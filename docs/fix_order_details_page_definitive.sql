
-- This script fixes the "structure of query does not match" and "operator does not exist"
-- errors on the Admin Order Details page.

-- Step 1: Ensure the 'created_at' column in the 'orders' table is a proper timestamp.
-- This is the root cause of the "operator does not exist" error.
-- NOTE: If this command has been run successfully before, you may see a notice
-- saying "column is already of type...", which is expected and can be ignored.
ALTER TABLE public.orders ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ;

-- Step 2: Drop the old, faulty function to ensure a clean state.
DROP FUNCTION IF EXISTS public.get_admin_order_details(p_order_number text);

-- Step 3: Re-create the function with the correct structure and return types.
CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at text,
    total_amount numeric,
    status public.order_status,
    shipping_details jsonb,
    profiles jsonb,
    order_items json,
    coupon_code text,
    discount_amount numeric,
    payment_method text,
    transaction_details jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
SELECT
    o.id,
    o.order_number,
    o.created_at::text,
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
                'price_at_purchase', oi.price,
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
    o.order_number = p_order_number
LIMIT 1;
$$;

-- Step 4: Grant permission to the function. This is crucial.
GRANT EXECUTE ON FUNCTION public.get_admin_order_details(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_order_details(text) TO service_role;
