-- This file documents the database schema and functions used by the application.
-- You can run this script in your Supabase SQL Editor to set up the necessary tables and functions.
-- It is designed to be idempotent, meaning you can run it multiple times without causing errors.

-- =============================================
-- ENUMS & TYPES
-- =============================================

-- Create order_status type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM (
            'Pending',
            'Processing',
            'Shipped',
            'Delivered',
            'Cancelled',
            'Failed'
        );
    END IF;
END$$;

-- =============================================
-- TABLES
-- =============================================

-- Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value text
);
-- Grant access to authenticated users to read settings
GRANT SELECT ON public.settings TO authenticated;

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    total_amount numeric(10, 2) NOT NULL,
    status public.order_status DEFAULT 'Pending'::public.order_status NOT NULL,
    shipping_details jsonb,
    coupon_code text,
    discount_amount numeric(10, 2),
    payment_details jsonb
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id integer, -- Assuming product IDs are integers
    quantity integer NOT NULL,
    price_at_purchase numeric(10, 2) NOT NULL
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint REFERENCES public.orders(id) ON DELETE CASCADE,
    amount numeric(10, 2) NOT NULL,
    payment_method text,
    status text, -- e.g., 'Completed', 'Failed'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    transaction_details jsonb
);


-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to create an order
-- This function handles creating an order, its items, and a transaction record.
CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status public.order_status DEFAULT 'Pending'
)
RETURNS text -- returns order_number
LANGUAGE plpgsql
SECURITY DEFINER -- To access tables with RLS
AS $$
DECLARE
    v_order_id bigint;
    v_order_number text;
    v_user_id uuid;
    item record;
BEGIN
    -- Get the user ID from the session
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Generate a unique order number
    v_order_number := 'KB-' || to_char(now(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6);

    -- Insert the order
    INSERT INTO public.orders (user_id, order_number, total_amount, shipping_details, status, coupon_code, discount_amount, payment_details)
    VALUES (v_user_id, v_order_number, p_total_amount, p_shipping_details, p_initial_status, p_coupon_code, p_discount_amount, p_transaction_details)
    RETURNING id INTO v_order_id;

    -- Insert order items
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id int, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, item.quantity, item.price)
        VALUES (v_order_id, item.product_id, item.quantity, item.price);
    END LOOP;

    -- Create a transaction record if payment method is provided
    IF p_payment_method IS NOT NULL THEN
        INSERT INTO public.transactions (order_id, amount, payment_method, status, transaction_details)
        VALUES (v_order_id, p_total_amount, p_payment_method, 'Pending', p_transaction_details);
    END IF;
    
    RETURN v_order_number;
END;
$$;


-- =============================================
-- Initial Data for Settings (Example)
-- =============================================
-- This demonstrates how to insert the necessary settings for aamarPay.
-- You should replace the placeholder values with your actual Store ID and Signature Key.

INSERT INTO public.settings (key, value) VALUES ('aamarpay_mode', 'sandbox') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('aamarpay_sandbox_store_id', 'aamarpaytest') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('aamarpay_sandbox_signature_key', 'dbb74894e82415a2f7ff0ec3a97e4183') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('aamarpay_production_store_id', 'YOUR_LIVE_STORE_ID') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('aamarpay_production_signature_key', 'YOUR_LIVE_SIGNATURE_KEY') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('enable_aamarpay', 'true') ON CONFLICT (key) DO NOTHING;
