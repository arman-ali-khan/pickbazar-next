-- Clear old, potentially broken functions and types using CASCADE to handle dependencies.
-- This ensures a clean slate.
DROP FUNCTION IF EXISTS public.create_order(uuid,numeric,jsonb,jsonb,text,jsonb,text,numeric) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_order_details(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_transactions() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_new_order() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_user_ids() CASCADE;
DROP FUNCTION IF EXISTS public.create_notification(uuid, text, text, text, public.notification_type) CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;

-- Re-create the enum type with all necessary values
CREATE TYPE public.notification_type AS ENUM (
    'new_order',
    'new_review',
    'new_question',
    'new_refund_request',
    'order_status_update',
    'order_placed'
);

-- Re-create the notifications table if it was dropped
CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    type public.notification_type
);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications
    FOR ALL USING ((get_my_role() = 'admin'::text) OR (get_my_role() = 'super-admin'::text) OR (get_my_role() = 'manager'::text))
    WITH CHECK ((get_my_role() = 'admin'::text) OR (get_my_role() = 'super-admin'::text) OR (get_my_role() = 'manager'::text));

-- Function to get admin users
CREATE OR REPLACE FUNCTION public.get_admin_user_ids()
RETURNS TABLE(user_id uuid)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT id FROM public.profiles WHERE role IN ('admin', 'super-admin', 'manager');
$$;

-- Function to create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id uuid,
    p_title text,
    p_message text,
    p_link text,
    p_type public.notification_type
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, title, message, link, type)
    VALUES (p_user_id, p_title, p_message, p_link, p_type);
END;
$$;

-- Trigger function to notify admins on new order
CREATE OR REPLACE FUNCTION public.notify_on_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    FOR admin_user_id IN SELECT user_id FROM public.get_admin_user_ids() LOOP
        PERFORM public.create_notification(
            admin_user_id,
            'New Order Received',
            'A new order with ID ' || NEW.order_number || ' has been placed.',
            '/admin/orders/' || NEW.order_number,
            'new_order'
        );
    END LOOP;
    RETURN NEW;
END;
$$;

-- Drop existing trigger and recreate it
DROP TRIGGER IF EXISTS on_order_inserted_notify ON public.orders;
CREATE TRIGGER on_order_inserted_notify
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_order();

-- Re-create the create_order function correctly.
-- SECURITY DEFINER allows it to bypass RLS for inserting into transactions table.
CREATE OR REPLACE FUNCTION public.create_order(
    p_user_id uuid,
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb DEFAULT NULL,
    p_coupon_code text DEFAULT NULL,
    p_discount_amount numeric DEFAULT 0
)
RETURNS text -- Returns the order_number
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
    new_order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || nextval('orders_id_seq');

    -- Insert the new order
    INSERT INTO public.orders (user_id, order_number, total_amount, shipping_details, coupon_code, discount_amount, status)
    VALUES (p_user_id, new_order_number, p_total_amount, p_shipping_details, p_coupon_code, p_discount_amount, 'Pending')
    RETURNING id INTO new_order_id;

    -- Insert order items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (
            new_order_id,
            (item->>'product_id')::bigint,
            (item->>'quantity')::int,
            (item->>'price')::numeric
        );
    END LOOP;

    -- Insert transaction record
    INSERT INTO public.transactions (order_id, user_id, amount, payment_method, status, transaction_details)
    VALUES (new_order_id, p_user_id, p_total_amount, p_payment_method, 'Completed', p_transaction_details)
    RETURNING id INTO new_transaction_id;

    -- Send notification to customer
    PERFORM public.create_notification(
        p_user_id,
        'Order Placed Successfully!',
        'Your order ' || new_order_number || ' has been placed.',
        '/profile/my-orders/' || new_order_number,
        'order_placed'
    );

    RETURN new_order_number;
END;
$$;


-- Recreate other functions to be safe
CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE (
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
    ) FROM public.order_items oi JOIN public.products pr ON oi.product_id = pr.id WHERE oi.order_id = o.id) as order_items,
    o.coupon_code,
    o.discount_amount,
    (SELECT t.payment_method FROM public.transactions t WHERE t.order_id = o.id LIMIT 1),
    (SELECT t.transaction_details FROM public.transactions t WHERE t.order_id = o.id LIMIT 1)
FROM
    public.orders o
JOIN
    public.profiles p ON o.user_id = p.id
WHERE
    o.order_number = p_order_number;
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
    status public.transaction_status,
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
FROM
    public.transactions t
JOIN
    public.orders o ON t.order_id = o.id
JOIN
    public.profiles p ON t.user_id = p.id
ORDER BY
    t.created_at DESC;
$$;
