
-- Drop existing objects in reverse order of dependency, using CASCADE to handle dependencies.
-- This makes the script runnable even if parts of it have failed before.
DROP FUNCTION IF EXISTS public.create_order(uuid,numeric,jsonb,jsonb,text,jsonb,text,numeric) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_order_details(p_order_number text) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_orders() CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;


-- Recreate the notification_type ENUM with all required values
CREATE TYPE public.notification_type AS ENUM (
    'new_order',
    'new_review',
    'order_placed',
    'order_shipped',
    'order_delivered',
    'refund_request',
    'refund_approved',
    'refund_rejected',
    'new_user_registered'
);


-- Recreate the notifications table
CREATE TABLE public.notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    type notification_type
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- This policy allows anyone with the 'admin' role (checked via a function) to perform any action.
CREATE POLICY "Admins can do anything" ON public.notifications FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- Recreate the create_order function
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
RETURNS text -- Returns the new order_number
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: Allows the function to bypass RLS for inserts
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    new_transaction_id bigint;
    item record;
BEGIN
    -- 1. Create a unique order number
    new_order_number := 'ORD-' || to_char(now(), 'YYMMDD') || '-' || nextval('orders_id_seq');

    -- 2. Insert the new order and get its ID
    INSERT INTO public.orders (user_id, order_number, total_amount, shipping_details, coupon_code, discount_amount, status)
    VALUES (p_user_id, new_order_number, p_total_amount, p_shipping_details, p_coupon_code, p_discount_amount, 'Pending')
    RETURNING id INTO new_order_id;

    -- 3. Insert the order items
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id int, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, item.product_id, item.quantity, item.price);
    END LOOP;

    -- 4. Create a transaction record
    INSERT INTO public.transactions (order_id, user_id, amount, payment_method, status, transaction_details)
    VALUES (new_order_id, p_user_id, p_total_amount, p_payment_method, 'Completed', p_transaction_details)
    RETURNING id INTO new_transaction_id;

    -- 5. Create a notification for admins
    INSERT INTO public.notifications (user_id, title, message, link, type)
    SELECT
        profile.id,
        'New Order Received',
        'A new order ' || new_order_number || ' has been placed.',
        '/admin/orders/' || new_order_number,
        'new_order'
    FROM public.profiles profile
    WHERE profile.role IN ('admin', 'manager', 'super-admin');

    -- 6. Create a notification for the customer
    INSERT INTO public.notifications (user_id, title, message, link, type)
    VALUES (
        p_user_id,
        'Order Placed Successfully',
        'Your order ' || new_order_number || ' has been placed.',
        '/profile/my-orders/' || new_order_number,
        'order_placed'
    );

    -- 7. Return the new order number
    RETURN new_order_number;
END;
$$;


-- Recreate the other helper functions
CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamp with time zone,
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
LANGUAGE sql
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
    FROM
        public.orders o
    LEFT JOIN
        public.profiles p ON o.user_id = p.id
    LEFT JOIN
        public.transactions t ON o.id = t.order_id
    WHERE
        o.order_number = p_order_number;
$$;


CREATE OR REPLACE FUNCTION public.get_admin_orders()
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
LANGUAGE sql
AS $$
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        p.full_name,
        u.email,
        p.avatar_url
    FROM
        public.orders o
    LEFT JOIN
        public.profiles p ON o.user_id = p.id
    LEFT JOIN
        auth.users u ON o.user_id = u.id
    ORDER BY
        o.created_at DESC;
$$;
