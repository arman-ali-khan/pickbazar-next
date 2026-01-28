
-- This file documents the database schema for the Karwanbazar application.
-- It is intended for reference and for setting up a local development environment.
-- IMPORTANT: To apply these changes, copy the content and run it in your Supabase SQL Editor.

-- Drop the old, ambiguous 7-argument function if it exists.
-- This ensures that only the correct 8-argument version is present.
DROP FUNCTION IF EXISTS public.create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric);


-- Tables
CREATE TABLE IF NOT EXISTS public.orders (
    id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id),
    order_number text NOT NULL UNIQUE,
    total_amount numeric NOT NULL,
    status text NOT NULL DEFAULT 'Pending'::text,
    shipping_details jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    coupon_code text,
    discount_amount numeric
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id bigint NOT NULL REFERENCES public.products(id),
    quantity integer NOT NULL,
    price_at_purchase numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    payment_method text NOT NULL,
    status text NOT NULL,
    transaction_details jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Note: The `settings` table is a simple key-value store.
CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL PRIMARY KEY,
    value text
);


-- Functions

-- Function to create a new order and its associated items, and return the order number.
CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status text DEFAULT 'Processing'::text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item record;
    new_transaction_id bigint;
    auth_user_id uuid;
BEGIN
    -- Get the authenticated user's ID
    auth_user_id := auth.uid();

    -- Generate a unique order number (e.g., KBN-timestamp-random)
    new_order_number := 'KBN-' || to_char(now(), 'YYMMDDHH24MISS') || '-' || upper(substring(md5(random()::text) for 6));

    -- Insert into orders table
    INSERT INTO public.orders (user_id, order_number, total_amount, status, shipping_details, coupon_code, discount_amount)
    VALUES (auth_user_id, new_order_number, p_total_amount, p_initial_status, p_shipping_details, p_coupon_code, p_discount_amount)
    RETURNING id INTO new_order_id;

    -- Insert into order_items table
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id bigint, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, item.product_id, item.quantity, item.price);
    END LOOP;
    
    -- Insert into transactions table
    INSERT INTO public.transactions (order_id, amount, payment_method, status, transaction_details)
    VALUES (new_order_id, p_total_amount, p_payment_method, p_initial_status, p_transaction_details)
    RETURNING id INTO new_transaction_id;

    -- Return the generated order number
    RETURN new_order_number;
END;
$$;


-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric, text) TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE orders_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE order_items_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE transactions_id_seq TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO authenticated;
GRANT SELECT ON TABLE public.settings TO authenticated;
GRANT SELECT ON TABLE public.products TO authenticated;

-- Make sure RLS is enabled on these tables and policies are in place
-- that allow authenticated users to perform these actions on their own data.
