-- This script is a comprehensive fix for all known order-related database issues.
-- It is designed to be run multiple times safely.

-- Step 1: Drop all old and potentially conflicting functions to ensure a clean slate.
DROP FUNCTION IF EXISTS public.get_admin_order_list();
DROP FUNCTION IF EXISTS public.get_admin_order_details(p_order_number text);
DROP FUNCTION IF EXISTS public.get_order_history(p_order_id bigint);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(p_order_id bigint, p_new_status text);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(p_order_id bigint, p_new_status public.order_status);
DROP FUNCTION IF EXISTS public.create_order(p_total_amount double precision, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount double precision, p_initial_status public.order_status);
DROP FUNCTION IF EXISTS public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status);


-- Step 2: Ensure the 'orders' table has the correct data type for 'created_at'.
-- This is the root cause of the "operator does not exist: text > unknown" error.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name = 'created_at'
        AND data_type <> 'timestamp with time zone'
    ) THEN
        ALTER TABLE public.orders
        ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ;
    END IF;
END $$;


-- Step 3: Re-create the necessary 'order_status' enum type if it doesn't exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM (
            'Pending',
            'Processing',
            'Shipped',
            'Delivered',
            'Cancelled',
            'Failed'
        );
    END IF;
END $$;

-- Step 4: Ensure 'order_history' table and its 'created_at' column are correct.
CREATE TABLE IF NOT EXISTS public.order_history (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    status public.order_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Make sure the 'created_at' column is of the correct type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'order_history'
        AND column_name = 'created_at'
        AND data_type <> 'timestamp with time zone'
    ) THEN
        ALTER TABLE public.order_history
        ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ;
    END IF;
END $$;


-- Step 5: Re-create the `update_order_status_and_log` function correctly.
CREATE OR REPLACE FUNCTION public.update_order_status_and_log(p_order_id bigint, p_new_status text)
RETURNS SETOF public.orders
LANGUAGE plpgsql
AS $function$
DECLARE
  v_new_status public.order_status;
BEGIN
  -- Cast the text input to the order_status enum
  v_new_status := p_new_status::public.order_status;

  -- Update the order status
  UPDATE public.orders
  SET status = v_new_status
  WHERE id = p_order_id;

  -- Log the status change
  INSERT INTO public.order_history (order_id, status)
  VALUES (p_order_id, v_new_status);

  -- Return the updated order row
  RETURN QUERY
  SELECT *
  FROM public.orders
  WHERE id = p_order_id;
END;
$function$;

-- Grant execute permissions to the authenticated role
GRANT EXECUTE ON FUNCTION public.update_order_status_and_log(bigint, text) TO authenticated;


-- Step 6: Re-create the `get_order_history` function.
CREATE OR REPLACE FUNCTION public.get_order_history(p_order_id bigint)
RETURNS TABLE(status text, created_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
AS $function$
  SELECT
    h.status::text,
    h.created_at
  FROM public.order_history h
  WHERE h.order_id = p_order_id
  ORDER BY h.created_at ASC;
$function$;
-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_order_history(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_history(bigint) TO service_role;


-- Step 7: Re-create the `get_admin_order_details` function with the correct return structure.
CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE(
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
LANGUAGE sql
SECURITY DEFINER
AS $function$
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
            'price_at_purchase', oi.price,
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
FROM
    public.orders o
JOIN
    public.profiles p ON o.user_id = p.id
WHERE
    o.order_number = p_order_number;
$function$;
-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_admin_order_details(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_order_details(text) TO service_role;

-- Step 8: Re-create the `get_admin_order_list` function.
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
LANGUAGE sql
SECURITY DEFINER
AS $function$
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
$function$;

GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO service_role;
