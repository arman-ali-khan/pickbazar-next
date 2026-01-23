
-- Drop functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.is_admin(user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_admins() CASCADE;
DROP FUNCTION IF EXISTS public.get_potential_admins() CASCADE;
DROP FUNCTION IF EXISTS public.get_all_users() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_details(p_user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.create_order(p_user_id uuid, p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_orders() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_transactions() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_transactions(p_user_id uuid) CASCADE;


-- Recreate the is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = user_id AND profiles.role IN ('admin', 'super-admin')
  );
$$;


-- Create or replace other functions
CREATE OR REPLACE FUNCTION public.get_admins()
RETURNS TABLE(id uuid, full_name text, email text, role text, avatar_url text)
LANGUAGE sql
AS $$
  SELECT 
    p.id, 
    p.full_name, 
    u.email,
    p.role,
    p.avatar_url
  FROM 
    profiles p 
  JOIN 
    auth.users u ON p.id = u.id
  WHERE 
    p.role IN ('admin', 'manager', 'super-admin');
$$;

CREATE OR REPLACE FUNCTION public.get_potential_admins()
RETURNS TABLE(id uuid, full_name text, email text, avatar_url text)
LANGUAGE sql
AS $$
  SELECT 
    p.id, 
    p.full_name, 
    u.email,
    p.avatar_url
  FROM 
    profiles p 
  JOIN 
    auth.users u ON p.id = u.id
  WHERE 
    p.role = 'customer';
$$;

CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id uuid, full_name text, email text, avatar_url text, created_at timestamptz, role text)
LANGUAGE sql
AS $$
  SELECT 
    p.id, 
    p.full_name, 
    u.email,
    p.avatar_url,
    u.created_at,
    p.role
  FROM 
    profiles p 
  JOIN 
    auth.users u ON p.id = u.id;
$$;


CREATE OR REPLACE FUNCTION public.get_user_details(p_user_id uuid)
RETURNS TABLE(id uuid, full_name text, email text, avatar_url text, created_at timestamptz, role text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.full_name, 
    u.email,
    p.avatar_url,
    u.created_at,
    p.role
  FROM 
    profiles p 
  JOIN 
    auth.users u ON p.id = u.id
  WHERE 
    p.id = p_user_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TABLE(role text)
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RETURN QUERY
    SELECT p.role
    FROM public.profiles p
    WHERE p.id = auth.uid();
  ELSE
    -- Return a row with a null role if the user is not authenticated
    RETURN QUERY SELECT NULL::text;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_order(
    p_user_id uuid,
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text DEFAULT NULL,
    p_discount_amount numeric DEFAULT 0
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id bigint;
    v_order_number text;
    item jsonb;
    v_transaction_id bigint;
BEGIN
    -- Generate Order Number
    v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || nextval('orders_id_seq');

    -- Insert into orders table
    INSERT INTO public.orders (user_id, total_amount, status, shipping_details, order_number, coupon_code, discount_amount)
    VALUES (p_user_id, p_total_amount, 'Pending', p_shipping_details, v_order_number, p_coupon_code, p_discount_amount)
    RETURNING id INTO v_order_id;

    -- Insert into order_items table
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (v_order_id, (item->>'product_id')::bigint, (item->>'quantity')::integer, (item->>'price')::numeric);
    END LOOP;

    -- Insert into transactions table
    INSERT INTO public.transactions (order_id, user_id, amount, payment_method, status, details)
    VALUES (v_order_id, p_user_id, p_total_amount, p_payment_method, 'Completed', p_transaction_details)
    RETURNING id INTO v_transaction_id;

    RETURN v_order_number;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_admin_orders()
RETURNS TABLE (
    id bigint,
    user_id uuid,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status text,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
LANGUAGE sql
AS $$
  SELECT 
    o.id,
    o.user_id,
    o.order_number,
    o.created_at,
    o.total_amount,
    o.status,
    p.full_name AS customer_name,
    u.email AS customer_email,
    p.avatar_url AS customer_avatar_url
  FROM 
    public.orders o
  JOIN 
    public.profiles p ON o.user_id = p.id
  JOIN
    auth.users u ON o.user_id = u.id
  ORDER BY
    o.created_at DESC;
$$;


CREATE OR REPLACE FUNCTION public.get_admin_transactions()
RETURNS TABLE (
    id bigint,
    order_id bigint,
    order_number text,
    customer_name text,
    customer_avatar text,
    amount numeric,
    payment_method text,
    status text,
    created_at timestamptz
)
LANGUAGE sql
AS $$
  SELECT 
      t.id,
      t.order_id,
      o.order_number,
      p.full_name as customer_name,
      p.avatar_url as customer_avatar,
      t.amount,
      t.payment_method,
      t.status,
      t.created_at
  FROM 
      public.transactions t
  JOIN 
      public.orders o ON t.order_id = o.id
  JOIN
      public.profiles p ON t.user_id = p.id
  ORDER BY 
      t.created_at DESC;
$$;


CREATE OR REPLACE FUNCTION public.get_user_transactions(p_user_id uuid)
RETURNS TABLE (
    id bigint,
    order_id bigint,
    order_number text,
    amount numeric,
    payment_method text,
    status text,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
      t.id,
      t.order_id,
      o.order_number,
      t.amount,
      t.payment_method,
      t.status,
      t.created_at
  FROM 
      public.transactions t
  JOIN
      public.orders o ON t.order_id = o.id
  WHERE 
      t.user_id = p_user_id
  ORDER BY 
      t.created_at DESC;
END;
$$;


-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_potential_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order(p_user_id uuid, p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_transactions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_transactions(p_user_id uuid) TO authenticated;


-- RLS Policies
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin full access to settings" ON public.settings;
CREATE POLICY "Allow admin full access to settings" ON public.settings
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin select for contact messages" ON public.contact_messages;
CREATE POLICY "Allow admin select for contact messages" ON public.contact_messages
FOR SELECT
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow admin update for contact messages" ON public.contact_messages;
CREATE POLICY "Allow admin update for contact messages" ON public.contact_messages
FOR UPDATE
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow admin delete for contact messages" ON public.contact_messages;
CREATE POLICY "Allow admin delete for contact messages" ON public.contact_messages
FOR DELETE
USING (is_admin(auth.uid()));

-- Clean up old guest-related files that are no longer needed
