-- This script is a comprehensive fix for all major order-related database functions.
-- It drops old, potentially broken functions and recreates them with the correct structure and data types.

-- Ensure the custom types and sequences exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Failed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'order_number_seq') THEN
        CREATE SEQUENCE public.order_number_seq START 1001;
    END IF;
END
$$;

-- Ensure the orders table has the correct columns before creating functions that depend on them
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method') THEN
        ALTER TABLE public.orders ADD COLUMN payment_method text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_details') THEN
        ALTER TABLE public.orders ADD COLUMN payment_details jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='coupon_code') THEN
        ALTER TABLE public.orders ADD COLUMN coupon_code text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discount_amount') THEN
        ALTER TABLE public.orders ADD COLUMN discount_amount double precision;
    END IF;
    -- Fix the data type for created_at if it's incorrect
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='created_at' AND udt_name != 'timestamptz') THEN
        ALTER TABLE public.orders ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ;
    END IF;
END
$$;


-- Function 1: get_admin_order_list (for /admin/orders page)
-- Drops the old function if it exists, ignoring errors if it doesn't.
DROP FUNCTION IF EXISTS public.get_admin_order_list();

-- Re-creates the function with corrected return types.
CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount double precision,
    status public.order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.order_number,
    o.created_at,
    o.total_amount,
    o.status,
    p.full_name as customer_name,
    u.email as customer_email,
    p.avatar_url as customer_avatar_url
  FROM
    public.orders o
  LEFT JOIN
    public.profiles p ON o.user_id = p.id
  LEFT JOIN
    auth.users u ON o.user_id = u.id
  ORDER BY
    o.created_at DESC;
END;
$$;
-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO authenticated;


-- Function 2: get_admin_order_details (for /admin/orders/[id] page)
-- Drops the old function if it exists.
DROP FUNCTION IF EXISTS public.get_admin_order_details(text);

-- Re-creates the function with the correct return structure.
CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount double precision,
    status public.order_status,
    shipping_details jsonb,
    profiles jsonb,
    order_items jsonb,
    coupon_code text,
    discount_amount double precision,
    payment_method text,
    transaction_details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
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
$$;
-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_admin_order_details(text) TO authenticated;


-- Function 3: get_order_history (for /admin/orders/[id] page)
-- Drops the old function.
DROP FUNCTION IF EXISTS public.get_order_history(bigint);

-- Re-creates the function.
CREATE OR REPLACE FUNCTION public.get_order_history(p_order_id bigint)
RETURNS TABLE(status text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT ol.status, ol.created_at
    FROM public.order_logs ol
    WHERE ol.order_id = p_order_id
    ORDER BY ol.created_at ASC;
END;
$$;
-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_order_history(bigint) TO authenticated;


-- Function 4: create_order (to fix payment issues)
-- Drop all possible conflicting versions of the function.
DROP FUNCTION IF EXISTS public.create_order(p_total_amount double precision, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount double precision, p_initial_status public.order_status);
DROP FUNCTION IF EXISTS public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status);
DROP FUNCTION IF EXISTS public.create_order(p_total_amount double precision, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount double precision, p_initial_status text);

-- Re-create the single, correct version of create_order.
CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount double precision,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount double precision,
    p_initial_status public.order_status
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    uid uuid;
BEGIN
    -- Get the current user's ID
    uid := auth.uid();
    
    -- Generate a unique order number
    new_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || nextval('order_number_seq');

    -- Insert the order
    INSERT INTO public.orders (
        user_id,
        order_number,
        total_amount,
        shipping_details,
        status,
        payment_method,
        payment_details,
        coupon_code,
        discount_amount
    )
    VALUES (
        uid,
        new_order_number,
        p_total_amount,
        p_shipping_details,
        p_initial_status,
        p_payment_method,
        p_transaction_details,
        p_coupon_code,
        p_discount_amount
    )
    RETURNING id INTO new_order_id;

    -- Insert order items
    INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
    SELECT
        new_order_id,
        (item->>'product_id')::bigint,
        (item->>'quantity')::integer,
        (item->>'price')::double precision
    FROM jsonb_array_elements(p_items) AS item;
    
    -- Log the initial status
    INSERT INTO public.order_logs (order_id, status)
    VALUES (new_order_id, p_initial_status::text);

    RETURN new_order_number;
END;
$$;
-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_order(double precision, jsonb, jsonb, text, jsonb, text, double precision, public.order_status) TO authenticated;
