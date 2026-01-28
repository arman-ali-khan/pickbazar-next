-- This script provides a comprehensive fix for all order-related database issues.
-- It ensures tables have the correct columns and rebuilds all necessary functions
-- from scratch to guarantee correctness and resolve persistent errors.

-- ========= Step 1: Ensure Orders Table has Correct Columns =========
-- Safely add columns if they don't exist to avoid errors on re-run.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method') THEN
    ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_details') THEN
    ALTER TABLE public.orders ADD COLUMN payment_details JSONB;
  END IF;
END;
$$;


-- ========= Step 2: Drop ALL conflicting and old functions =========
-- This ensures a clean slate and removes any ambiguous or outdated function definitions.

DROP FUNCTION IF EXISTS public.get_admin_order_details(p_order_number text);
DROP FUNCTION IF EXISTS public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status);
DROP FUNCTION IF EXISTS public.create_order(p_total_amount double precision, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount double precision, p_initial_status public.order_status);
DROP FUNCTION IF EXISTS public.create_order(p_total_amount double precision, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(p_order_id bigint, p_new_status text);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(p_order_id bigint, p_new_status public.order_status);
DROP FUNCTION IF EXISTS public.get_order_history(p_order_id bigint);
DROP FUNCTION IF EXISTS public.get_admin_order_list();


-- ========= Step 3: Re-create Functions with Correct Definitions =========

-- 3.1: get_order_history
CREATE OR REPLACE FUNCTION public.get_order_history(p_order_id bigint)
RETURNS TABLE(status text, created_at timestamptz)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT os.status, os.created_at
  FROM public.order_status_history os
  WHERE os.order_id = p_order_id
  ORDER BY os.created_at;
END;
$$;

-- 3.2: update_order_status_and_log
CREATE OR REPLACE FUNCTION public.update_order_status_and_log(p_order_id bigint, p_new_status order_status)
RETURNS SETOF orders
LANGUAGE plpgsql
AS $$
DECLARE
    updated_order orders;
BEGIN
    -- Update the order status
    UPDATE public.orders
    SET status = p_new_status
    WHERE id = p_order_id
    RETURNING * INTO updated_order;

    -- Log the status change
    INSERT INTO public.order_status_history (order_id, status)
    VALUES (p_order_id, p_new_status);

    RETURN NEXT updated_order;
END;
$$;

-- 3.3: create_order
CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status order_status
)
RETURNS text -- Returns the new order_number
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item jsonb;
    p_user_id uuid;
BEGIN
    -- Get user ID from session, or null if not logged in
    p_user_id := auth.uid();

    -- Generate a unique order number
    new_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || lpad( (nextval('order_number_seq'))::text, 6, '0');

    -- Insert the order
    INSERT INTO public.orders (user_id, order_number, total_amount, shipping_details, status, coupon_code, discount_amount, payment_method, payment_details)
    VALUES (p_user_id, new_order_number, p_total_amount, p_shipping_details, p_initial_status, p_coupon_code, p_discount_amount, p_payment_method, p_transaction_details)
    RETURNING id INTO new_order_id;

    -- Insert order items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, (item->>'product_id')::bigint, (item->>'quantity')::int, (item->>'price')::numeric);

        -- Decrement stock
        UPDATE public.products
        SET stock = stock - (item->>'quantity')::int
        WHERE id = (item->>'product_id')::bigint;
    END LOOP;
    
    -- Log initial status
    INSERT INTO public.order_status_history (order_id, status)
    VALUES (new_order_id, p_initial_status);

    RETURN new_order_number;
END;
$$;

-- 3.4: get_admin_order_list
CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
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
    COALESCE(p.full_name, o.shipping_details->>'firstName' || ' ' || o.shipping_details->>'lastName') AS customer_name,
    COALESCE(u.email, o.shipping_details->>'email') AS customer_email,
    p.avatar_url
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

-- 3.5: get_admin_order_details (THE FIX)
-- This function is completely rebuilt to ensure its structure matches the SELECT statement.
-- It correctly handles NULLs from LEFT JOINs and aggregates data into JSON as expected by the frontend.
CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status order_status,
    shipping_details jsonb,
    profiles jsonb, -- Return a single JSONB object, which can be NULL
    order_items jsonb, -- Return a JSONB array of objects
    coupon_code text,
    discount_amount numeric,
    payment_method text,
    transaction_details jsonb -- Aliased from payment_details
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
        -- Aggregate profile info into a single JSON object, which will be null if no profile is found
        CASE 
            WHEN p.id IS NOT NULL THEN jsonb_build_object(
                'full_name', p.full_name,
                'avatar_url', p.avatar_url
            )
            ELSE NULL
        END as profiles,
        -- Aggregate order items into a JSON array
        (SELECT jsonb_agg(
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
        o.payment_details as transaction_details -- Alias column to match frontend expectation
    FROM
        public.orders o
    LEFT JOIN
        public.profiles p ON o.user_id = p.id
    WHERE
        o.order_number = p_order_number;
END;
$$;
