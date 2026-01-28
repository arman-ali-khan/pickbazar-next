-- This script is designed to be idempotent and safe to re-run.

-- Create the order_status enum type if it doesn't already exist.
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

-- Create the order_history table if it doesn't exist to track status changes.
CREATE TABLE IF NOT EXISTS public.order_history (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    status public.order_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create the sequence for the order_history table's primary key if it doesn't exist.
CREATE SEQUENCE IF NOT EXISTS public.order_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Set the default value for the order_history.id column to use the sequence.
ALTER TABLE public.order_history ALTER COLUMN id SET DEFAULT nextval('public.order_history_id_seq'::regclass);


-- Use CREATE OR REPLACE to update the function without dependency errors.
-- This function logs status changes to the order_history table.
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.order_history (order_id, status)
    VALUES (NEW.id, NEW.status);
    RETURN NEW;
END;
$$;


-- Drop the existing trigger first to avoid conflicts, then recreate it.
-- This ensures the trigger is correctly associated with the updated function.
DROP TRIGGER IF EXISTS log_order_status_change_trigger ON public.orders;

CREATE TRIGGER log_order_status_change_trigger
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();


-- Use CREATE OR REPLACE for the main order creation function.
-- This ensures the function is always the correct and most up-to-date version.
CREATE OR REPLACE FUNCTION public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status DEFAULT 'Pending'::public.order_status)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item jsonb;
    current_user_id uuid;
BEGIN
    -- Get the current user's ID from the auth context
    SELECT auth.uid() INTO current_user_id;

    -- If no user is authenticated, raise an exception
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Generate a unique order number
    new_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || substr(md5(random()::text), 0, 7);

    -- Insert the new order and get its ID
    INSERT INTO public.orders (user_id, order_number, total_amount, shipping_details, coupon_code, discount_amount, status)
    VALUES (current_user_id, new_order_number, p_total_amount, p_shipping_details, p_coupon_code, p_discount_amount, p_initial_status)
    RETURNING id INTO new_order_id;

    -- Insert order items from the JSONB array
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (
            new_order_id,
            (item->>'product_id')::bigint,
            (item->>'quantity')::integer,
            (item->>'price')::numeric
        );
    END LOOP;

    -- Insert transaction details if provided
    IF p_payment_method IS NOT NULL THEN
        INSERT INTO public.transactions (order_id, payment_method, transaction_details, amount, status)
        VALUES (
            new_order_id,
            p_payment_method,
            p_transaction_details,
            p_total_amount,
            'Completed' -- Assume transaction is completed at this stage for simplicity
        );
    END IF;

    RETURN new_order_number;
END;
$$;

-- Function to update order status and log the change.
CREATE OR REPLACE FUNCTION public.update_order_status_and_log(p_order_id bigint, p_new_status public.order_status)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the order status
    UPDATE public.orders
    SET status = p_new_status
    WHERE id = p_order_id;
    
    -- The trigger `log_order_status_change_trigger` will automatically
    -- log this change to the order_history table.

    -- Return the updated order row
    RETURN QUERY
    SELECT * FROM public.orders WHERE id = p_order_id;
END;
$$;
