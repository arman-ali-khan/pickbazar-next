-- Drop existing functions and types if they exist to ensure a clean slate
DROP FUNCTION IF EXISTS public.create_order(uuid,numeric,jsonb,jsonb,text,text,numeric);
DROP FUNCTION IF EXISTS public.get_admin_order_list();

-- Recreate the order_status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM (
            'Pending',
            'Processing',
            'Shipped',
            'Delivered',
            'Cancelled'
        );
    END IF;
END$$;


-- Ensure the orders table has the correct structure
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS payment_method text,
    ADD COLUMN IF NOT EXISTS transaction_id text,
    ADD COLUMN IF NOT EXISTS discount_amount numeric,
    ADD COLUMN IF NOT EXISTS coupon_code text;


-- This function handles creating an order and returns the new order_number.
CREATE OR REPLACE FUNCTION public.create_order(
    p_user_id uuid,
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_coupon_code text,
    p_discount_amount numeric
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    new_transaction_id bigint;
BEGIN
    -- Generate a unique order number
    new_order_number := 'ORD-' || to_char(now(), 'YYMMDD') || '-' || nextval('public.orders_id_seq');

    -- Insert the order
    INSERT INTO public.orders (user_id, total_amount, shipping_details, order_number, coupon_code, discount_amount)
    VALUES (p_user_id, p_total_amount, p_shipping_details, new_order_number, p_coupon_code, p_discount_amount)
    RETURNING id INTO new_order_id;

    -- Insert order items
    INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
    SELECT new_order_id, (item->>'product_id')::int, (item->>'quantity')::int, (item->>'price')::numeric
    FROM jsonb_array_elements(p_items) AS item;

    -- Create a transaction record
    INSERT INTO public.transactions (order_id, amount, payment_method, status)
    VALUES (new_order_id, p_total_amount, p_payment_method, 'Completed')
    RETURNING id INTO new_transaction_id;

    -- Update the order with the transaction_id
    UPDATE public.orders SET transaction_id = new_transaction_id::text WHERE id = new_order_id;

    RETURN new_order_number;
END;
$$;


-- This function retrieves a list of orders for the admin dashboard.
CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamp with time zone,
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
      COALESCE(p.full_name, o.shipping_details->>'firstName' || ' ' || o.shipping_details->>'lastName') AS customer_name,
      COALESCE(u.email, o.shipping_details->>'email') AS customer_email,
      p.avatar_url AS customer_avatar_url
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
