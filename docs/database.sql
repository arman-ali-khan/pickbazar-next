-- This script is designed to be "idempotent," meaning you can run it multiple
-- times without causing errors. It will only create tables, types, or functions
-- if they don't already exist.

-- Create the ENUM type for order status if it doesn't exist
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

-- Create the orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id),
    order_number text UNIQUE NOT NULL,
    total_amount numeric(10, 2) NOT NULL,
    status order_status NOT NULL DEFAULT 'Pending',
    shipping_details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_details jsonb,
    coupon_code text,
    discount_amount numeric(10, 2)
);

-- Create the order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id bigint,
    quantity integer NOT NULL,
    price_at_purchase numeric(10, 2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create the transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.transactions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    amount numeric(10, 2) NOT NULL,
    payment_method text,
    status text,
    transaction_details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create or replace the function to create an order
-- This function handles creating an order, its associated items, and a transaction record.
CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status text DEFAULT 'Pending'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id bigint;
    v_order_number text;
    v_user_id uuid;
    item record;
BEGIN
    -- Get user ID from session
    SELECT auth.uid() INTO v_user_id;

    -- Generate a unique order number
    v_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || substr(md5(random()::text), 1, 6);

    -- Insert into orders table
    INSERT INTO public.orders (user_id, order_number, total_amount, shipping_details, status, coupon_code, discount_amount, payment_details)
    VALUES (v_user_id, v_order_number, p_total_amount, p_shipping_details, p_initial_status::order_status, p_coupon_code, p_discount_amount, p_transaction_details)
    RETURNING id INTO v_order_id;

    -- Insert into order_items table
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id bigint, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (v_order_id, item.product_id, item.quantity, item.price);
    END LOOP;

    -- Insert into transactions table
    IF p_payment_method IS NOT NULL THEN
      INSERT INTO public.transactions (order_id, user_id, amount, payment_method, status, transaction_details)
      VALUES (v_order_id, v_user_id, p_total_amount, p_payment_method, p_initial_status, p_transaction_details);
    END IF;

    RETURN v_order_number;
END;
$$;
