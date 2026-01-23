-- Forcefully drop all dependent objects to ensure a clean slate.
DROP FUNCTION IF EXISTS public.create_order(uuid, numeric, jsonb, jsonb, text, jsonb, text, numeric);
DROP FUNCTION IF EXISTS public.get_admin_order_list();
DROP FUNCTION IF EXISTS public.get_admin_order_details(text);
DROP FUNCTION IF EXISTS public.get_admin_notifications();
DROP FUNCTION IF EXISTS public.get_admin_transactions();

DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;


-- Re-create custom types
DROP TYPE IF EXISTS public.order_status;
CREATE TYPE public.order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled');

DROP TYPE IF EXISTS public.transaction_status;
CREATE TYPE public.transaction_status AS ENUM ('Pending', 'Completed', 'Failed');

DROP TYPE IF EXISTS public.notification_type;
CREATE TYPE public.notification_type AS ENUM ('new_order', 'new_review', 'new_user', 'refund_request');

DROP TYPE IF EXISTS public.user_role;
CREATE TYPE public.user_role AS ENUM ('customer', 'manager', 'admin', 'super-admin');


-- Alter profiles table to use the new user_role type
-- This assumes a 'profiles' table exists. If not, this part might need adjustment.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'customer';


-- Re-create tables with the correct types and constraints
CREATE TABLE IF NOT EXISTS public.orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id),
    order_number text UNIQUE NOT NULL,
    total_amount numeric(10, 2) NOT NULL,
    status order_status NOT NULL DEFAULT 'Pending',
    shipping_details jsonb,
    coupon_code text,
    discount_amount numeric(10, 2),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id bigint REFERENCES public.products(id),
    quantity integer NOT NULL,
    price_at_purchase numeric(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint REFERENCES public.orders(id) ON DELETE CASCADE,
    amount numeric(10, 2) NOT NULL,
    payment_method text,
    status transaction_status NOT NULL DEFAULT 'Pending',
    transaction_details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id), -- Can be null for system-wide notifications
    recipient_role user_role, -- Target a role, e.g., 'admin'
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false,
    type notification_type,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


-- Function to create an order and related records
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
    new_order_id bigint;
    new_order_number text;
    item jsonb;
    new_transaction_id bigint;
BEGIN
    -- Generate a unique order number
    new_order_number := 'ORD-' || to_char(now(), 'YYMMDD') || '-' || nextval('orders_id_seq');

    -- Insert into orders table
    INSERT INTO public.orders (user_id, order_number, total_amount, shipping_details, payment_method, coupon_code, discount_amount)
    VALUES (p_user_id, new_order_number, p_total_amount, p_shipping_details, p_payment_method, p_coupon_code, p_discount_amount)
    RETURNING id INTO new_order_id;

    -- Insert order items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, (item->>'product_id')::bigint, (item->>'quantity')::integer, (item->>'price')::numeric);
    END LOOP;

    -- Insert transaction record
    INSERT INTO public.transactions (order_id, amount, payment_method, transaction_details, status)
    VALUES (new_order_id, p_total_amount, p_payment_method, p_transaction_details, 'Completed')
    RETURNING id INTO new_transaction_id;
    
    -- Create notification for admins
    INSERT INTO public.notifications (recipient_role, title, message, link, type)
    VALUES ('admin', 'New Order Received', 'A new order ' || new_order_number || ' has been placed.', '/admin/orders/' || new_order_number, 'new_order');

    RETURN new_order_number;
END;
$$;

-- Function for admins to get a list of all orders
CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount numeric,
    status order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        p.full_name AS customer_name,
        u.email AS customer_email,
        p.avatar_url AS customer_avatar_url
    FROM
        public.orders o
    LEFT JOIN
        auth.users u ON o.user_id = u.id
    LEFT JOIN
        public.profiles p ON o.user_id = p.id
    ORDER BY
        o.created_at DESC;
$$;

-- Function to get detailed order info for admins
CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamp with time zone,
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
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        o.shipping_details,
        jsonb_build_object('full_name', p.full_name, 'avatar_url', p.avatar_url) as profiles,
        (SELECT jsonb_agg(jsonb_build_object('id', oi.id, 'quantity', oi.quantity, 'price_at_purchase', oi.price_at_purchase, 'products', prod_details))
         FROM public.order_items oi
         LEFT JOIN (SELECT id, name, featured_image_url FROM public.products) as prod_details ON oi.product_id = prod_details.id
         WHERE oi.order_id = o.id) as order_items,
        o.coupon_code,
        o.discount_amount,
        t.payment_method,
        t.transaction_details
    FROM public.orders o
    LEFT JOIN public.profiles p ON o.user_id = p.id
    LEFT JOIN public.transactions t ON o.id = t.order_id
    WHERE o.order_number = p_order_number;
$$;

-- Function to get admin notifications
CREATE OR REPLACE FUNCTION public.get_admin_notifications()
RETURNS TABLE (
    id bigint,
    title text,
    message text,
    link text,
    is_read boolean,
    created_at timestamp with time zone,
    type notification_type
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        id, title, message, link, is_read, created_at, type
    FROM public.notifications
    WHERE recipient_role = 'admin'
    ORDER BY created_at DESC;
$$;

-- Function to get admin transactions
CREATE OR REPLACE FUNCTION public.get_admin_transactions()
RETURNS TABLE(
    id bigint,
    order_id bigint,
    order_number text,
    customer_name text,
    customer_avatar text,
    amount numeric,
    payment_method text,
    status transaction_status,
    created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
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
    FROM public.transactions t
    JOIN public.orders o ON t.order_id = o.id
    LEFT JOIN public.profiles p ON o.user_id = p.id
    ORDER BY t.created_at DESC;
$$;
