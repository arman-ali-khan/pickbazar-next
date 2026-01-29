--
-- This is a definitive script to fix all recurring database errors related to orders.
-- Please run this entire script in your Supabase SQL Editor.
--

-- Section 1: Correct the data type for the 'created_at' column in the 'orders' table.
-- This fixes the "operator does not exist: text > unknown" error.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orders'
          AND column_name = 'created_at'
          AND udt_name = 'text'
    ) THEN
        ALTER TABLE public.orders
        ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ;
    END IF;
END;
$$;


-- Section 2: Remove ambiguous/duplicate functions that cause "could not choose best candidate" errors.
DROP FUNCTION IF EXISTS public.update_order_status_and_log(p_order_id bigint, p_new_status text);
DROP FUNCTION IF EXISTS public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status text);


-- Section 3: Recreate the function for the Admin Order List page.
-- This fixes "structure of query does not match" and date sorting errors.
DROP FUNCTION IF EXISTS public.get_admin_order_list();
CREATE OR REPLACE FUNCTION get_admin_order_list()
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at text,
    total_amount numeric,
    status order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at::text,
        o.total_amount,
        o.status,
        p.full_name,
        u.email,
        p.avatar_url
    FROM public.orders o
    LEFT JOIN public.profiles p ON o.user_id = p.id
    LEFT JOIN auth.users u ON o.user_id = u.id
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Section 4: Recreate the function for the Admin Order Details page.
-- This fixes "structure of query does not match" and "order not found" issues.
DROP FUNCTION IF EXISTS public.get_admin_order_details(p_order_number text);
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at text,
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
AS $$
BEGIN
    RETURN QUERY
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
            JOIN public.products pr ON oi.product_id = pr.id
            WHERE oi.order_id = o.id
        ) as order_items,
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.payment_details as transaction_details
    FROM public.orders o
    LEFT JOIN public.profiles p ON o.user_id = p.id
    WHERE o.order_number = p_order_number;
END;
$$ LANGUAGE plpgsql STABLE;


-- Section 5: Grant necessary permissions for the new functions.
GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_order_details(p_order_number text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_order_details(p_order_number text) TO service_role;
