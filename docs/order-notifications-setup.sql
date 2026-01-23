-- Comprehensive Order & Notification System Setup
-- This script is designed to be run in its entirety and is idempotent.

-- PART 1: Types and Tables
-------------------------------------------------

-- Create ENUM for order status if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled');
    END IF;
END
$$;

-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    total_amount numeric(10, 2) NOT NULL,
    status public.order_status DEFAULT 'Pending' NOT NULL,
    shipping_details jsonb NOT NULL,
    coupon_code text,
    discount_amount numeric(10, 2)
);

-- Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id int NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity int NOT NULL,
    price_at_purchase numeric(10, 2) NOT NULL
);

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.transactions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    amount numeric(10, 2) NOT NULL,
    payment_method text NOT NULL,
    status text DEFAULT 'Completed' NOT NULL, -- e.g., Completed, Failed
    created_at timestamptz DEFAULT now() NOT NULL,
    transaction_details jsonb
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    type text
);

-- PART 2: Row Level Security (RLS)
-------------------------------------------------

-- Enable RLS on all tables if not already enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all access for service_role" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;


-- Function to check for admin roles (re-create to be safe)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'manager', 'super-admin')
    );
$$;
-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- Policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (public.is_admin());

-- Policies for order_items
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM public.orders WHERE id = order_items.order_id)
);
CREATE POLICY "Admins can manage all order items" ON public.order_items FOR ALL USING (public.is_admin());

-- Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all transactions" ON public.transactions FOR ALL USING (public.is_admin());


-- Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (public.is_admin());

-- PART 3: Functions
-------------------------------------------------

-- Drop old function before creating new one
DROP FUNCTION IF EXISTS public.create_order(uuid, numeric, jsonb, jsonb, text, jsonb, text, numeric);

-- Main function to create an order
CREATE OR REPLACE FUNCTION public.create_order(
    p_user_id uuid,
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb DEFAULT NULL,
    p_coupon_code text DEFAULT NULL,
    p_discount_amount numeric DEFAULT NULL
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
    admin_user record;
BEGIN
    -- Generate a unique order number
    new_order_number := 'ORD-' || to_char(now(), 'YYMMDD') || '-' || substr(md5(random()::text), 1, 6);

    -- Insert into orders table
    INSERT INTO public.orders (user_id, order_number, total_amount, status, shipping_details, coupon_code, discount_amount)
    VALUES (p_user_id, new_order_number, p_total_amount, 'Pending', p_shipping_details, p_coupon_code, p_discount_amount)
    RETURNING id INTO new_order_id;

    -- Insert order items
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id int, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, item.product_id, item.quantity, item.price);
    END LOOP;

    -- Insert into transactions table
    INSERT INTO public.transactions (order_id, user_id, amount, payment_method, status, transaction_details)
    VALUES (new_order_id, p_user_id, p_total_amount, p_payment_method, 'Completed', p_transaction_details);

    -- Insert notification for admins
    FOR admin_user IN SELECT id FROM public.profiles WHERE role IN ('admin', 'manager', 'super-admin')
    LOOP
        INSERT INTO public.notifications (user_id, title, message, link, type)
        VALUES (admin_user.id, 'New Order Received', 'Order ' || new_order_number || ' has been placed.', '/admin/orders/' || new_order_number, 'new_order');
    END LOOP;
    
    -- Insert notification for the customer
    INSERT INTO public.notifications (user_id, title, message, link, type)
    VALUES (p_user_id, 'Order Confirmed', 'Your order ' || new_order_number || ' has been successfully placed.', '/profile/my-orders/' || new_order_number, 'order_placed');

    -- Return the order number
    RETURN new_order_number;
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.create_order(uuid, numeric, jsonb, jsonb, text, jsonb, text, numeric) TO authenticated;
