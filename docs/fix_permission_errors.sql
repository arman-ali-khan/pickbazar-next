-- Drop all potentially conflicting functions to ensure a clean slate.
DROP FUNCTION IF EXISTS public.get_admin_order_list();
DROP FUNCTION IF EXISTS public.get_admin_order_details(text);
DROP FUNCTION IF EXISTS public.get_order_history(integer);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(integer,text);
DROP FUNCTION IF EXISTS public.create_order(double precision,jsonb,jsonb,text,jsonb,text,double precision,public.order_status);
DROP FUNCTION IF EXISTS public.create_order(numeric,jsonb,jsonb,text,jsonb,text,numeric,public.order_status);


-- Re-create get_admin_order_list with NUMERIC type for currency.
-- This function is for the main /admin/orders page.
CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE(
    id integer,
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
AS $function$
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
      auth.users u on o.user_id = u.id
  ORDER BY
      o.created_at DESC;
END;
$function$;

-- Re-create get_admin_order_details with NUMERIC type for currency.
-- This function is for the /admin/orders/[id] page.
CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id integer,
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
    transaction_details jsonb,
    payment_details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    ) AS profiles,
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
    ) AS order_items,
    o.coupon_code,
    o.discount_amount,
    o.payment_method,
    o.transaction_details,
    o.payment_details
  FROM public.orders o
  LEFT JOIN public.profiles p ON o.user_id = p.id
  WHERE o.order_number = p_order_number;
END;
$function$;

-- Re-create create_order function (only ONE version with NUMERIC).
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
AS $function$
DECLARE
    new_order_id integer;
    new_order_number text;
    item record;
BEGIN
    -- Generate a unique order number
    new_order_number := 'KB-' || substr(md5(random()::text), 0, 9);

    -- Insert the new order
    INSERT INTO public.orders (
        user_id,
        order_number,
        total_amount,
        shipping_details,
        status,
        payment_method,
        transaction_details,
        coupon_code,
        discount_amount
    )
    VALUES (
        auth.uid(),
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
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id int, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price)
        VALUES (new_order_id, item.product_id, item.quantity, item.price);
    END LOOP;

    -- Return the order number
    RETURN new_order_number;
END;
$function$;

-- Re-create get_order_history function correctly.
CREATE OR REPLACE FUNCTION public.get_order_history(p_order_id integer)
RETURNS TABLE(status text, created_at timestamptz)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT ol.status, ol.created_at
    FROM public.order_logs ol
    WHERE ol.order_id = p_order_id
    ORDER BY ol.created_at ASC;
END;
$function$;

-- Re-create update_order_status_and_log function
CREATE OR REPLACE FUNCTION public.update_order_status_and_log(p_order_id integer, p_new_status text)
RETURNS SETOF public.orders
LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE public.orders
    SET status = p_new_status::public.order_status
    WHERE id = p_order_id;

    INSERT INTO public.order_logs(order_id, status)
    VALUES (p_order_id, p_new_status);

    RETURN QUERY SELECT * FROM public.orders WHERE id = p_order_id;
END;
$function$;


-- Grant execute permissions to the authenticated role for these functions
GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_order_details(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order(numeric,jsonb,jsonb,text,jsonb,text,numeric,public.order_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_history(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_status_and_log(integer,text) TO authenticated;