-- Drop existing objects if they exist to ensure a clean setup
DROP TRIGGER IF EXISTS on_new_order_notification ON public.orders;
DROP FUNCTION IF EXISTS public.handle_new_order_notification();
DROP FUNCTION IF EXISTS public.create_order(uuid,numeric,jsonb,jsonb,text,jsonb,text,numeric);
DROP FUNCTION IF EXISTS public.get_admin_order_details(p_order_number text);
DROP FUNCTION IF EXISTS public.get_user_transactions(p_user_id uuid);
DROP FUNCTION IF EXISTS public.get_admin_transactions();

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    type text
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
DROP POLICY IF EXISTS "Allow authenticated users to read their own notifications" ON public.notifications;
CREATE POLICY "Allow authenticated users to read their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin to manage all notifications" ON public.notifications;
CREATE POLICY "Allow admin to manage all notifications"
ON public.notifications FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));


-- Add transaction_details to transactions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'transactions'
        AND column_name = 'transaction_details'
    ) THEN
        ALTER TABLE public.transactions ADD COLUMN transaction_details jsonb;
    END IF;
END
$$;

-- Function to handle new order notifications
CREATE OR REPLACE FUNCTION public.handle_new_order_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a notification for each admin/manager
    INSERT INTO public.notifications (user_id, title, message, link, type)
    SELECT
        p.id,
        'New Order Received!',
        'Order ' || NEW.order_number || ' for $' || NEW.total_amount || ' has been placed.',
        '/admin/orders/' || NEW.order_number,
        'new_order'
    FROM public.profiles p
    WHERE p.role IN ('admin', 'manager', 'super-admin');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new order notifications
CREATE TRIGGER on_new_order_notification
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_new_order_notification();


-- Function to create a new order
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
    INSERT INTO public.orders (user_id, total_amount, status, shipping_details, order_number, coupon_code, discount_amount)
    VALUES (p_user_id, p_total_amount, 'Pending', p_shipping_details, new_order_number, p_coupon_code, p_discount_amount)
    RETURNING id INTO new_order_id;

    -- Insert into order_items table
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, (item->>'product_id')::bigint, (item->>'quantity')::integer, (item->>'price')::numeric);
    END LOOP;

    -- Insert into transactions table
    INSERT INTO public.transactions (order_id, user_id, amount, payment_method, status, transaction_details)
    VALUES (new_order_id, p_user_id, p_total_amount, p_payment_method, 'Completed', p_transaction_details)
    RETURNING id INTO new_transaction_id;

    RETURN new_order_number;
END;
$$;


-- Function for admin to get order details
CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE(
    id bigint,
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
) AS $$
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
                    'price_at_purchase', oi.price_at_purchase,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get user transactions
CREATE OR REPLACE FUNCTION public.get_user_transactions(p_user_id uuid)
RETURNS TABLE (
    id bigint,
    order_id bigint,
    order_number text,
    amount numeric,
    payment_method text,
    status public.transaction_status,
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

-- Function to get admin transactions
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
  LEFT JOIN
    public.profiles p ON t.user_id = p.id
  ORDER BY
    t.created_at DESC;
END;
$$;


-- Enable RLS and define policies for transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow user to see their own transactions" ON public.transactions;
CREATE POLICY "Allow user to see their own transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admins to see all transactions" ON public.transactions;
CREATE POLICY "Allow admins to see all transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Note: INSERT for transactions is handled by the SECURITY DEFINER create_order function
-- No explicit INSERT policy for users is needed, which is more secure.
