-- Drop existing functions and types to ensure a clean slate.
-- We use `IF EXISTS` to avoid errors if they don't exist.
DROP FUNCTION IF EXISTS public.get_admin_order_list();
DROP FUNCTION IF EXISTS public.get_admin_order_details(p_order_number text);
DROP FUNCTION IF EXISTS public.get_order_history(p_order_id bigint);
DROP FUNCTION IF EXISTS public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status);
DROP FUNCTION IF EXISTS public.create_order(p_total_amount double precision, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount double precision, p_initial_status public.order_status);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(p_order_id bigint, p_new_status public.order_status);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(p_order_id bigint, p_new_status text);
DROP FUNCTION IF EXISTS public.get_all_users();
DROP TYPE IF EXISTS public.order_status;

-- Create the order_status enum type
CREATE TYPE public.order_status AS ENUM (
    'Pending',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Failed'
);

-- Alter orders table to ensure correct data types and columns.
-- Use a DO block to add columns only if they don't exist.
DO $$
BEGIN
    -- Check and add payment_method column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_method') THEN
        ALTER TABLE public.orders ADD COLUMN payment_method text;
    END IF;

    -- Check and add payment_details column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_details') THEN
        ALTER TABLE public.orders ADD COLUMN payment_details jsonb;
    END IF;

    -- Ensure created_at is timestamptz
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'created_at' AND data_type <> 'timestamp with time zone') THEN
        ALTER TABLE public.orders ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ;
    END IF;
END;
$$;


-- Recreate the get_all_users function
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    created_at timestamptz,
    role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        p.full_name,
        u.email,
        p.avatar_url,
        u.created_at,
        p.role
    FROM
        auth.users u
    LEFT JOIN
        public.profiles p ON u.id = p.id
    ORDER BY u.created_at DESC;
END;
$$;
-- Grant permissions for get_all_users
GRANT EXECUTE ON FUNCTION public.get_all_users() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO anon;


-- Recreate the get_admin_order_list function
CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status public.order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        COALESCE(p.full_name, o.shipping_details->>'firstName' || ' ' || o.shipping_details->>'lastName') as customer_name,
        COALESCE(u.email, o.shipping_details->>'email') as customer_email,
        p.avatar_url as customer_avatar_url
    FROM
        orders o
    LEFT JOIN
        auth.users u ON o.user_id = u.id
    LEFT JOIN
        profiles p ON o.user_id = p.id
    ORDER BY
        o.created_at DESC;
END;
$$;
-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO anon;


-- Recreate the get_admin_order_details function
CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status public.order_status,
    shipping_details jsonb,
    profiles jsonb,
    order_items jsonb,
    coupon_code text,
    discount_amount numeric,
    payment_method text,
    transaction_details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      'full_name', COALESCE(p.full_name, o.shipping_details->>'firstName' || ' ' || o.shipping_details->>'lastName'),
      'avatar_url', p.avatar_url
    ) as profiles,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'quantity', oi.quantity,
          'price_at_purchase', oi.price,
          'products', jsonb_build_object(
            'name', prod.name,
            'featured_image_url', prod.featured_image_url
          )
        )
      )
      FROM order_items oi
      JOIN products prod ON oi.product_id = prod.id
      WHERE oi.order_id = o.id
    ) as order_items,
    o.coupon_code,
    o.discount_amount,
    o.payment_method,
    o.payment_details as transaction_details
  FROM
    orders o
  LEFT JOIN
    profiles p ON o.user_id = p.id
  WHERE
    o.order_number = p_order_number;
END;
$$;
-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_admin_order_details(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_order_details(text) TO anon;

-- Recreate get_order_history function
CREATE OR REPLACE FUNCTION public.get_order_history(p_order_id bigint)
RETURNS TABLE (
    status text,
    created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT status, created_at FROM public.order_status_history
  WHERE order_id = p_order_id
  ORDER BY created_at ASC;
$$;
-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_order_history(bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_order_history(bigint) TO anon;

-- Recreate update_order_status_and_log function
CREATE OR REPLACE FUNCTION public.update_order_status_and_log(p_order_id bigint, p_new_status text)
RETURNS TABLE (
  order_number text,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_number text;
  v_user_id uuid;
BEGIN
    UPDATE orders
    SET status = p_new_status::public.order_status
    WHERE id = p_order_id
    RETURNING orders.order_number, orders.user_id INTO v_order_number, v_user_id;

    RETURN QUERY SELECT v_order_number, v_user_id;
END;
$$;
-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_order_status_and_log(bigint, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_order_status_and_log(bigint, text) TO anon;


-- Recreate create_order function
CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status public.order_status
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id bigint;
    v_order_number text;
    v_user_id uuid := auth.uid();
    item record;
BEGIN
    v_order_number := 'KB-' || to_char(now(), 'YYMMDDHH24MISS') ||- (random() * 1000)::int;

    INSERT INTO orders (user_id, order_number, total_amount, shipping_details, status, payment_method, payment_details, coupon_code, discount_amount)
    VALUES (v_user_id, v_order_number, p_total_amount, p_shipping_details, p_initial_status, p_payment_method, p_transaction_details, p_coupon_code, p_discount_amount)
    RETURNING id INTO v_order_id;

    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id bigint, quantity int, price numeric)
    LOOP
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (v_order_id, item.product_id, item.quantity, item.price);
    END LOOP;

    RETURN v_order_number;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric, public.order_status) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric, public.order_status) TO anon;
