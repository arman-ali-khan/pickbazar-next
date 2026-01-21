-- Clean up old objects first with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.create_order(uuid,numeric,jsonb,jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.create_order(uuid,numeric,jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.create_order(uuid,numeric,jsonb,public.order_item_input[]) CASCADE;
DROP FUNCTION IF EXISTS public.create_order(uuid,numeric,jsonb,json) CASCADE;
DROP FUNCTION IF EXISTS public.create_order(uuid, numeric, jsonb, jsonb, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_order(p_user_id uuid, p_total_amount numeric, p_shipping_details jsonb, p_items jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.create_order(p_user_id uuid, p_total numeric, p_shipping_details jsonb, p_items jsonb) CASCADE;


DROP TYPE IF EXISTS public.order_item_input CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;

-- Create an ENUM type for order status
CREATE TYPE public.order_status AS ENUM (
    'Pending',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled'
);

-- Recreate tables with the correct schema
-- Drop tables if they exist to ensure a clean slate, using CASCADE
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- Create the orders table
CREATE TABLE public.orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status public.order_status DEFAULT 'Pending'::public.order_status NOT NULL,
    total_amount numeric(10, 2) NOT NULL,
    shipping_details jsonb,
    order_number text UNIQUE
);

-- Create the order_items table
CREATE TABLE public.order_items (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id integer REFERENCES public.products(id) ON DELETE SET NULL,
    quantity integer NOT NULL,
    price_at_purchase numeric(10, 2) NOT NULL
);

-- Enable RLS and define policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies for orders
CREATE POLICY "Allow individual user to read their own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Allow individual user to create their own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policies for order_items
CREATE POLICY "Allow individual user to read their own order items"
    ON public.order_items FOR SELECT
    USING (
      auth.uid() = (
        SELECT user_id FROM public.orders WHERE id = order_items.order_id
      )
    );

CREATE POLICY "Allow individual user to create their own order items"
    ON public.order_items FOR INSERT
    WITH CHECK (
      auth.uid() = (
        SELECT user_id FROM public.orders WHERE id = order_items.order_id
      )
    );
    
-- Allow admin full access
CREATE POLICY "Allow admin full access on orders" ON public.orders FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow admin full access on order_items" ON public.order_items FOR ALL
USING (true)
WITH CHECK (true);

-- Create the function to create an order
CREATE OR REPLACE FUNCTION public.create_order(
    p_user_id uuid,
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item jsonb;
BEGIN
    -- Generate a unique order number
    new_order_number := 'ORD-' || to_char(now(), 'YYMMDD') || '-' || upper(substring(md5(random()::text) for 8));

    -- Insert the order
    INSERT INTO public.orders (user_id, total_amount, shipping_details, order_number)
    VALUES (p_user_id, p_total_amount, p_shipping_details, new_order_number)
    RETURNING id INTO new_order_id;

    -- Loop through the items and insert them
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (
            new_order_id,
            (item->>'product_id')::integer,
            (item->>'quantity')::integer,
            (item->>'price')::numeric
        );
    END LOOP;

    -- Return the new order number
    RETURN new_order_number;
END;
$$;
