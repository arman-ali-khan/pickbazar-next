-- Drop old versions of the function and its dependent types to avoid conflicts.
DROP FUNCTION IF EXISTS create_order(numeric, jsonb, order_item_input[]) CASCADE;
DROP FUNCTION IF EXISTS create_order(uuid, numeric, jsonb, order_item_input[]) CASCADE;
DROP TYPE IF EXISTS order_item_input CASCADE;

-- Create the custom type for order items
CREATE TYPE order_item_input AS (
    product_id integer,
    quantity integer,
    price numeric
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id),
    order_number text UNIQUE,
    total_amount numeric NOT NULL,
    status text DEFAULT 'Pending', -- e.g., Pending, Processing, Shipped, Delivered, Cancelled
    shipping_details jsonb,
    created_at timestamptz DEFAULT now()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint REFERENCES orders(id) ON DELETE CASCADE,
    product_id integer REFERENCES products(id),
    quantity integer NOT NULL,
    price numeric NOT NULL
);


-- Function to create an order and its items
CREATE OR REPLACE FUNCTION create_order(
    p_user_id uuid,
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items order_item_input[]
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item order_item_input;
BEGIN
    -- Generate a unique order number
    new_order_number := 'ORD-' || to_char(now(), 'YYMMDD') || '-' || substr(md5(random()::text), 1, 6);

    -- Insert the new order
    INSERT INTO public.orders (user_id, order_number, total_amount, shipping_details, status)
    VALUES (p_user_id, new_order_number, p_total_amount, p_shipping_details, 'Pending')
    RETURNING id INTO new_order_id;

    -- Insert order items
    FOREACH item IN ARRAY p_items
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price)
        VALUES (new_order_id, item.product_id, item.quantity, item.price);
    END LOOP;

    RETURN new_order_number;
END;
$$;


-- Migration script to rename 'total' to 'total_amount' if it exists.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name = 'total'
    ) THEN
        ALTER TABLE public.orders RENAME COLUMN total TO total_amount;
    END IF;
END $$;
