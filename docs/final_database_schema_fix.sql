
-- Drop the function to allow for schema changes and re-creation
DROP FUNCTION IF EXISTS public.create_new_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status, p_user_id uuid);

-- This block ensures the 'id' column will auto-increment.
-- It is the definitive fix for the "id violates not-null constraint" error.
DO $$
BEGIN
    -- Check if the id column is already an IDENTITY column
    IF NOT EXISTS (
        SELECT 1
        FROM pg_attribute
        WHERE attrelid = 'public.orders'::regclass
          AND attname = 'id'
          AND attidentity = 'd' -- 'd' for "by default"
    ) THEN
        -- If not, we will make it one.
        -- First, create a sequence. The name is not critical but good practice.
        CREATE SEQUENCE IF NOT EXISTS public.orders_id_seq;

        -- Then, set the default value of the 'id' column to the next value of the sequence.
        ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq');

        -- Associate the sequence with the column. This is important for ownership and dropping.
        ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;

        -- Set the sequence's current value to be higher than any existing ID to prevent duplicates.
        -- PERFORM is used because we don't need the result of the SELECT.
        PERFORM setval('public.orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.orders), true);
    END IF;
END;
$$;


-- Re-create the function to insert orders.
-- This function now relies on the corrected table schema to generate IDs.
CREATE OR REPLACE FUNCTION public.create_new_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status public.order_status,
    p_user_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    order_item record;
BEGIN
    -- Insert the new order. The 'id' is now generated automatically by the database.
    INSERT INTO public.orders (
        user_id, total_amount, shipping_details, payment_method, payment_details, coupon_code, discount_amount, status
    )
    VALUES (
        p_user_id, p_total_amount, p_shipping_details, p_payment_method, p_transaction_details, p_coupon_code, p_discount_amount, p_initial_status
    )
    RETURNING id INTO new_order_id;

    -- Generate a unique order number (e.g., using the ID)
    new_order_number := 'KB-' || to_char(current_timestamp, 'YYMMDD') || '-' || new_order_id;

    -- Update the order with the generated order number
    UPDATE public.orders
    SET order_number = new_order_number
    WHERE id = new_order_id;

    -- Insert order items
    FOR order_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id int, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, order_item.product_id, order_item.quantity, order_item.price);
    END LOOP;

    -- Log the initial status in order_history
    INSERT INTO public.order_history (order_id, status)
    VALUES (new_order_id, p_initial_status);

    RETURN new_order_number;
END;
$$;
