-- Drop existing objects to ensure a clean slate, handling dependencies.
-- This is critical to fix the state left by previous failed scripts.
DROP FUNCTION IF EXISTS public.create_order(text,numeric,jsonb,jsonb,text,jsonb,text,numeric);
DROP FUNCTION IF EXISTS public.create_order(uuid,numeric,jsonb,jsonb,text,jsonb,text,numeric);
DROP FUNCTION IF EXISTS public.get_admin_order_details(text);
DROP FUNCTION IF EXISTS public.get_admin_order_list();
DROP FUNCTION IF EXISTS public.get_admin_notifications();
DROP FUNCTION IF EXISTS public.handle_new_order_notification() CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;
DROP TYPE IF EXISTS public.transaction_status CASCADE;

-- Recreate custom types
CREATE TYPE public.order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled');
CREATE TYPE public.notification_type AS ENUM ('new_order', 'new_review', 'refund_request', 'low_stock');
CREATE TYPE public.transaction_status AS ENUM ('Pending', 'Completed', 'Failed');


-- Ensure tables have the correct columns. This is safer than dropping tables.
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS status public.order_status DEFAULT 'Pending'::public.order_status;

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS status public.transaction_status DEFAULT 'Pending'::public.transaction_status;

-- Recreate notifications table to ensure it's correct
DROP TABLE IF EXISTS public.notifications CASCADE;
CREATE TABLE public.notifications (
    id bigint NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    type public.notification_type
);
CREATE SEQUENCE public.notifications_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;
ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


-- Function to handle new order notifications
CREATE OR REPLACE FUNCTION public.handle_new_order_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_users RECORD;
BEGIN
  -- Insert a notification for each admin/manager/super-admin
  FOR admin_users IN
    SELECT id FROM public.profiles WHERE role IN ('admin', 'manager', 'super-admin')
  LOOP
    INSERT INTO public.notifications (user_id, title, message, link, type)
    VALUES (
      admin_users.id,
      'New Order Received',
      'A new order with ID ' || NEW.order_number || ' has been placed.',
      '/admin/orders/' || NEW.order_number,
      'new_order'
    );
  END LOOP;
  RETURN NEW;
END;
$$;


-- Trigger to call the notification function after a new order is inserted
CREATE TRIGGER on_new_order_created
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_order_notification();


-- Recreate the create_order function with correct signature and logic
CREATE OR REPLACE FUNCTION public.create_order(
    p_user_id uuid,
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id INT;
  new_order_number TEXT;
  item JSONB;
BEGIN
  -- Insert into orders table
  INSERT INTO public.orders (user_id, total_amount, shipping_details, coupon_code, discount_amount, status)
  VALUES (p_user_id, p_total_amount, p_shipping_details, p_coupon_code, p_discount_amount, 'Pending')
  RETURNING id, order_number INTO new_order_id, new_order_number;

  -- Insert into order_items table
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (order_id, product_id, quantity, price)
    VALUES (new_order_id, (item->>'product_id')::INT, (item->>'quantity')::INT, (item->>'price')::NUMERIC);
  END LOOP;

  -- Insert into transactions table
  INSERT INTO public.transactions (order_id, user_id, amount, payment_method, transaction_details, status)
  VALUES (new_order_id, p_user_id, p_total_amount, p_payment_method, p_transaction_details, 'Completed');

  RETURN new_order_number;
END;
$$;

-- Recreate the get_admin_order_list function
CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE(
    id integer,
    order_number text,
    created_at timestamp with time zone,
    total_amount numeric,
    status public.order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
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
    COALESCE(p.full_name, (o.shipping_details->>'firstName' || ' ' || o.shipping_details->>'lastName')) AS customer_name,
    COALESCE(u.email, o.shipping_details->>'email') as customer_email,
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
$$ LANGUAGE plpgsql;


-- Recreate the get_admin_order_details function
CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE(
    id int,
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
            'full_name', COALESCE(p.full_name, (o.shipping_details->>'firstName' || ' ' || o.shipping_details->>'lastName')),
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
        (SELECT t.payment_method FROM public.transactions t WHERE t.order_id = o.id LIMIT 1) AS payment_method,
        (SELECT t.transaction_details FROM public.transactions t WHERE t.order_id = o.id LIMIT 1) AS transaction_details
    FROM public.orders o
    LEFT JOIN public.profiles p ON o.user_id = p.id
    WHERE o.order_number = p_order_number;
END;
$$ LANGUAGE plpgsql;

-- Recreate the get_admin_notifications function
CREATE OR REPLACE FUNCTION public.get_admin_notifications()
RETURNS TABLE (
    id bigint,
    title text,
    message text,
    link text,
    is_read boolean,
    created_at timestamptz,
    type public.notification_type
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT n.id, n.title, n.message, n.link, n.is_read, n.created_at, n.type
    FROM public.notifications n
    JOIN public.profiles p ON n.user_id = p.id
    WHERE p.role IN ('admin', 'manager', 'super-admin')
    ORDER BY n.created_at DESC
    LIMIT 50;
END;
$$;
