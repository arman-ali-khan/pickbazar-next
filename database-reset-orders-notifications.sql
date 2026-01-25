
-- START OF SCRIPT

-- Drop existing objects in reverse order of dependency, using CASCADE

-- Drop functions that depend on types or tables
DROP FUNCTION IF EXISTS public.create_order(uuid,numeric,jsonb,jsonb,text,jsonb,text,numeric) CASCADE;
DROP FUNCTION IF EXISTS public.create_order(uuid,numeric,jsonb,jsonb[],text,jsonb,text,numeric) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_order_list() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_order_details(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_notifications() CASCADE;
DROP FUNCTION IF EXISTS public.generate_order_number() CASCADE;

-- Drop tables that depend on types
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;


-- Create types
CREATE TYPE public.order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled');
CREATE TYPE public.notification_type AS ENUM ('new_order', 'new_review', 'refund_request', 'status_update');
CREATE TYPE public.user_role AS ENUM ('customer', 'manager', 'admin', 'super-admin');


-- Create tables

-- Orders Table
CREATE TABLE public.orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    status public.order_status NOT NULL DEFAULT 'Pending'::public.order_status,
    total_amount numeric(10, 2) NOT NULL,
    shipping_details jsonb NOT NULL,
    order_number text UNIQUE NOT NULL,
    coupon_code text,
    discount_amount numeric(10, 2) DEFAULT 0
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to read their own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow admins to manage all orders" ON public.orders FOR ALL TO authenticated USING (public.get_my_role() IN ('admin', 'manager', 'super-admin')) WITH CHECK (public.get_my_role() IN ('admin', 'manager', 'super-admin'));


-- Order Items Table
CREATE TABLE public.order_items (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity integer NOT NULL,
    price_at_purchase numeric(10, 2) NOT NULL
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to read their own order items" ON public.order_items FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM public.orders WHERE ((orders.id = order_items.order_id) AND (orders.user_id = auth.uid())))));
CREATE POLICY "Allow admins to manage all order_items" ON public.order_items FOR ALL TO authenticated USING (public.get_my_role() IN ('admin', 'manager', 'super-admin')) WITH CHECK (public.get_my_role() IN ('admin', 'manager', 'super-admin'));


-- Transactions Table
CREATE TABLE public.transactions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    amount numeric(10, 2) NOT NULL,
    payment_method text NOT NULL,
    status text NOT NULL DEFAULT 'Completed',
    transaction_details jsonb
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to read their own transactions" ON public.transactions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM public.orders WHERE ((orders.id = transactions.order_id) AND (orders.user_id = auth.uid())))));
CREATE POLICY "Allow admins to manage all transactions" ON public.transactions FOR ALL TO authenticated USING (public.get_my_role() IN ('admin', 'manager', 'super-admin')) WITH CHECK (public.get_my_role() IN ('admin', 'manager', 'super-admin'));


-- Notifications Table
CREATE TABLE public.notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id),
    recipient_role public.user_role,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    type public.notification_type
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admin/manager roles to manage all notifications" ON public.notifications FOR ALL TO authenticated USING (public.get_my_role() IN ('admin', 'manager', 'super-admin')) WITH CHECK (public.get_my_role() IN ('admin', 'manager', 'super-admin'));
CREATE POLICY "Allow users to read their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);


-- Create functions

-- Function to generate a unique order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_order_number text;
BEGIN
    LOOP
        new_order_number := 'ORD-' || substr(md5(random()::text), 0, 9);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = new_order_number);
    END LOOP;
    RETURN new_order_number;
END;
$$;


-- Function to create an order
CREATE OR REPLACE FUNCTION public.create_order(
    p_user_id uuid,
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric
) RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id bigint;
    v_order_number text;
    item jsonb;
BEGIN
    -- Generate order number
    v_order_number := public.generate_order_number();

    -- Insert into orders table
    INSERT INTO public.orders (user_id, total_amount, shipping_details, order_number, coupon_code, discount_amount)
    VALUES (p_user_id, p_total_amount, p_shipping_details, v_order_number, p_coupon_code, p_discount_amount)
    RETURNING id INTO v_order_id;

    -- Insert into order_items table
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (v_order_id, (item->>'product_id')::bigint, (item->>'quantity')::int, (item->>'price')::numeric);
    END LOOP;

    -- Insert into transactions table
    INSERT INTO public.transactions (order_id, amount, payment_method, transaction_details)
    VALUES (v_order_id, p_total_amount, p_payment_method, p_transaction_details);

    -- Create notification for admins
    INSERT INTO public.notifications (recipient_role, title, message, link, type)
    VALUES ('admin', 'New Order Received', 'A new order ' || v_order_number || ' has been placed.', '/admin/orders/' || v_order_number, 'new_order');

    RETURN v_order_number;
END;
$$;

-- Function to get admin order list
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
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        COALESCE(
            p.full_name,
            CONCAT_WS(' ', o.shipping_details->>'firstName', o.shipping_details->>'lastName')
        ) AS customer_name,
        COALESCE(
            u.email,
            o.shipping_details->>'email'
        ) AS customer_email,
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


-- Function to get admin order details
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
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
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
        (SELECT jsonb_agg(jsonb_build_object(
            'id', oi.id,
            'quantity', oi.quantity,
            'price_at_purchase', oi.price_at_purchase,
            'products', jsonb_build_object(
                'name', pr.name,
                'featured_image_url', pr.featured_image_url
            )
        )) FROM public.order_items oi JOIN public.products pr ON oi.product_id = pr.id WHERE oi.order_id = o.id) as order_items,
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
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT
        n.id,
        n.title,
        n.message,
        n.link,
        n.is_read,
        n.created_at,
        n.type
    FROM
        public.notifications n
    WHERE
        n.recipient_role = ANY(ARRAY['admin'::public.user_role, 'manager'::public.user_role, 'super-admin'::public.user_role])
    ORDER BY
        n.created_at DESC;
$$;

-- END OF SCRIPT
