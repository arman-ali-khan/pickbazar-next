-- =================================================================
-- Essential Types & Functions for Karwanbazar
-- =================================================================
-- This script contains only the necessary types and functions for the application.
-- It is designed to be run safely multiple times. It will not create tables.

-- Create custom types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Failed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('customer', 'manager', 'admin', 'super-admin');
    END IF;
END$$;


-- Drop the old, ambiguous function signature if it exists.
-- This function signature used `text` for the status, which caused ambiguity with the correct function that uses the `order_status` type.
DROP FUNCTION IF EXISTS public.create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric, text);


-- This is the correct, primary function for creating an order.
-- It is idempotent and can be run safely multiple times.
CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status public.order_status DEFAULT 'Pending'::public.order_status
)
RETURNS text -- This will be the order_number
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item_record jsonb;
BEGIN
    -- Generate a unique order number
    new_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || substr(md5(random()::text), 1, 6);

    -- Insert the order
    INSERT INTO public.orders (
        user_id,
        order_number,
        total_amount,
        shipping_details,
        coupon_code,
        discount_amount,
        status
    )
    VALUES (
        auth.uid(),
        new_order_number,
        p_total_amount,
        p_shipping_details,
        p_coupon_code,
        p_discount_amount,
        p_initial_status
    )
    RETURNING id INTO new_order_id;

    -- Insert order items
    FOR item_record IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            price_at_purchase
        )
        VALUES (
            new_order_id,
            (item_record->>'product_id')::bigint,
            (item_record->>'quantity')::integer,
            (item_record->>'price')::numeric
        );

        -- Decrement stock
        UPDATE public.products
        SET stock = stock - (item_record->>'quantity')::integer
        WHERE id = (item_record->>'product_id')::bigint;
    END LOOP;

    -- Insert transaction
    INSERT INTO public.transactions (
        order_id,
        user_id,
        amount,
        payment_method,
        transaction_details,
        status
    )
    VALUES (
        new_order_id,
        auth.uid(),
        p_total_amount,
        p_payment_method,
        p_transaction_details,
        'Pending' -- Transactions are pending until confirmed
    );
    
    -- Log initial status
    INSERT INTO public.order_history (order_id, status)
    VALUES (new_order_id, p_initial_status);

    RETURN new_order_number;
END;
$$;
