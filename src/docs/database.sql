-- This script is designed to be idempotent (re-runnable).
-- It will create tables, types, and functions if they don't exist,
-- and replace them if they do, ensuring a consistent database state.

-- Drop old, ambiguous function signatures if they exist.
DROP FUNCTION IF EXISTS public.create_order(text,numeric,text,jsonb,text,jsonb,numeric);
DROP FUNCTION IF EXISTS public.create_order(numeric,jsonb,jsonb,text,jsonb,text,numeric,text);


-- Define custom types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Failed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('customer', 'manager', 'admin', 'super-admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'address_type') THEN
        CREATE TYPE public.address_type AS ENUM ('billing', 'shipping');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE public.review_status AS ENUM ('Pending', 'Approved', 'Hidden');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_status') THEN
        CREATE TYPE public.question_status AS ENUM ('Pending', 'Answered');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status') THEN
        CREATE TYPE public.refund_status AS ENUM ('Pending', 'Approved', 'Rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status') THEN
        CREATE TYPE public.offer_status AS ENUM ('active', 'inactive', 'expired');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
        CREATE TYPE public.product_status AS ENUM ('draft', 'active', 'archived');
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE public.transaction_status AS ENUM ('Pending', 'Completed', 'Failed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE public.notification_type AS ENUM (
            'new_order', 'order_update', 'new_review', 'new_question', 'question_answered', 
            'new_refund', 'refund_update', 'promotion', 'role_update', 'new_message', 'order_shipped',
            'review_request', 'security'
        );
    END IF;
END
$$;

-- Create the order_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.order_history (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status public.order_status NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Function to log order status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.order_history (order_id, status)
    VALUES (NEW.id, NEW.status);
    RETURN NEW;
END;
$$;

-- Trigger to log status changes on the orders table
-- Drop existing trigger before creating a new one to avoid errors
DROP TRIGGER IF EXISTS orders_status_update_trigger ON public.orders;

CREATE TRIGGER orders_status_update_trigger
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();


-- This is the main function for creating an order.
-- It's idempotent, meaning it will replace any existing function with the same name and arguments.
CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount numeric, 
    p_shipping_details jsonb, 
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status public.order_status
)
RETURNS text -- returns the order_number
LANGUAGE plpgsql
SECURITY DEFINER -- very important!
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item jsonb;
    current_product_stock int;
    new_transaction_id bigint;
    auth_user_id uuid;
BEGIN
    -- Get the authenticated user's ID
    auth_user_id := auth.uid();
    
    -- Generate a unique order number
    new_order_number := 'PB-' || to_char(now(), 'YYMMDD') || '-' || substr(md5(random()::text), 0, 7);

    -- Insert the new order
    INSERT INTO public.orders (
        user_id, 
        order_number, 
        total_amount, 
        shipping_details, 
        status, 
        coupon_code, 
        discount_amount,
        payment_method,
        payment_details
    )
    VALUES (
        auth_user_id,
        new_order_number,
        p_total_amount,
        p_shipping_details,
        p_initial_status,
        p_coupon_code,
        p_discount_amount,
        p_payment_method,
        p_transaction_details
    )
    RETURNING id INTO new_order_id;

    -- Insert order items and update stock
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Get current stock
        SELECT stock INTO current_product_stock FROM public.products WHERE id = (item->>'product_id')::bigint;

        -- Check if there is enough stock
        IF current_product_stock IS NULL OR current_product_stock < (item->>'quantity')::int THEN
            RAISE EXCEPTION 'Not enough stock for product ID %', (item->>'product_id')::bigint;
        END IF;

        INSERT INTO public.order_items (
            order_id, 
            product_id, 
            quantity, 
            price_at_purchase
        )
        VALUES (
            new_order_id,
            (item->>'product_id')::bigint,
            (item->>'quantity')::int,
            (item->>'price')::numeric
        );

        -- Update product stock
        UPDATE public.products
        SET stock = stock - (item->>'quantity')::int
        WHERE id = (item->>'product_id')::bigint;
    END LOOP;
    
    -- Insert transaction details
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
        auth_user_id,
        p_total_amount,
        p_payment_method,
        p_transaction_details,
        CASE 
            WHEN p_initial_status = 'Processing' THEN 'Completed'::transaction_status
            WHEN p_initial_status = 'Pending' THEN 'Pending'::transaction_status
            ELSE 'Failed'::transaction_status
        END
    )
    RETURNING id INTO new_transaction_id;

    RETURN new_order_number;
END;
$$;


-- Function to update order status and return key details for notification
CREATE OR REPLACE FUNCTION public.update_order_status_and_log(
    p_order_id bigint,
    p_new_status text
)
RETURNS TABLE(order_number text, user_id uuid)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_number text;
    v_user_id uuid;
BEGIN
    UPDATE public.orders
    SET status = p_new_status::public.order_status
    WHERE id = p_order_id
    RETURNING orders.order_number, orders.user_id INTO v_order_number, v_user_id;

    RETURN QUERY SELECT v_order_number, v_user_id;
END;
$$;
