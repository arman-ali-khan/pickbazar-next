
-- Drop existing functions and types if they exist to ensure a clean slate
DROP FUNCTION IF EXISTS public.create_order(uuid,numeric,jsonb,jsonb,text,jsonb,text,numeric);
DROP FUNCTION IF EXISTS public.get_admin_order_details(text);
DROP FUNCTION IF EXISTS public.get_admin_notifications();
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.transactions;
DROP TYPE IF EXISTS public.notification_type;

-- Create the notification type enum
CREATE TYPE public.notification_type AS ENUM (
    'new_order',
    'new_review',
    'refund_request',
    'order_status_change',
    'order_placed'
);

-- Create the notifications table
CREATE TABLE public.notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    role_based_delivery text, -- e.g., 'admin', 'manager'
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false NOT NULL,
    type notification_type,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add Policies for notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view role-based notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'super-admin')
  AND role_based_delivery IN ('admin', 'manager', 'super-admin')
);

CREATE POLICY "Allow authenticated users to create notifications for themselves"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow creating notifications for admins"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (role_based_delivery IS NOT NULL);

ALTER TABLE public.notifications ALTER COLUMN role_based_delivery SET DEFAULT NULL;
ALTER TABLE public.notifications ALTER COLUMN user_id SET DEFAULT NULL;


-- Create the transactions table
CREATE TABLE public.transactions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    payment_method text,
    status text DEFAULT 'Completed'::text,
    transaction_details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Policies for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'super-admin')
);

CREATE POLICY "Allow inserts for security definer functions"
ON public.transactions FOR INSERT
TO postgres
WITH CHECK (true);


-- Function to get admin notifications
CREATE OR REPLACE FUNCTION public.get_admin_notifications()
RETURNS TABLE(id bigint, title text, message text, link text, is_read boolean, created_at timestamp with time zone, type text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.message,
    n.link,
    n.is_read,
    n.created_at,
    n.type::text
  FROM
    public.notifications n
  WHERE
    n.role_based_delivery IN ('admin', 'manager', 'super-admin')
    AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('admin', 'manager', 'super-admin')
  ORDER BY
    n.created_at DESC;
END;
$$;


-- Function to get order details for admin
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
LANGUAGE plpgsql
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
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ),
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', oi.id,
                'quantity', oi.quantity,
                'price_at_purchase', oi.price,
                'products', jsonb_build_object(
                    'name', pr.name,
                    'featured_image_url', pr.featured_image_url
                )
            )
        ) FROM public.order_items oi JOIN public.products pr ON oi.product_id = pr.id WHERE oi.order_id = o.id),
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
END;
$$;


-- The main function to create an order
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
SET search_path = public
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item record;
BEGIN
    -- Generate a unique order number
    new_order_number := 'ORD-' || (
        SELECT string_agg(c, '')
        FROM (
            SELECT unnest(string_to_array(lower(gen_random_uuid()::text), NULL)) AS c
            ORDER BY random()
            LIMIT 10
        ) AS s
    );

    -- Insert the new order
    INSERT INTO public.orders (user_id, total_amount, shipping_details, order_number, coupon_code, discount_amount, status)
    VALUES (p_user_id, p_total_amount, p_shipping_details, new_order_number, p_coupon_code, p_discount_amount, 'Pending')
    RETURNING id INTO new_order_id;

    -- Insert order items
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id bigint, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price)
        VALUES (new_order_id, item.product_id, item.quantity, item.price);
    END LOOP;

    -- Insert transaction record
    INSERT INTO public.transactions (order_id, user_id, amount, payment_method, transaction_details, status)
    VALUES (new_order_id, p_user_id, p_total_amount, p_payment_method, p_transaction_details, 'Completed');
    
    -- Create notification for the user
    INSERT INTO public.notifications (user_id, title, message, link, type)
    VALUES (
        p_user_id,
        'Order Placed!',
        'Your order ' || new_order_number || ' has been successfully placed.',
        '/profile/my-orders/' || new_order_number,
        'order_placed'
    );

    -- Create notification for admins
    INSERT INTO public.notifications (role_based_delivery, title, message, link, type)
    VALUES (
        'admin',
        'New Order Received',
        'A new order ' || new_order_number || ' has been placed.',
        '/admin/orders/' || new_order_number,
        'new_order'
    );


    RETURN new_order_number;
END;
$$;
