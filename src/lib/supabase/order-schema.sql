
-- Drop function and type if they exist for clean reruns
DROP FUNCTION IF EXISTS public.create_order(numeric, jsonb, order_item_input[]);
DROP TYPE IF EXISTS public.order_item_input;

-- Create a custom type for the items array in the function
CREATE TYPE public.order_item_input AS (
    product_id integer,
    quantity integer,
    price numeric
);

-- Create orders table with a user-facing order number
CREATE TABLE IF NOT EXISTS public.orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    total_amount numeric(10, 2) NOT NULL,
    status text DEFAULT 'Pending' NOT NULL,
    shipping_details jsonb,
    order_number TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || upper(substr(md5(random()::text), 0, 8))
);

-- Create order_items table to store products for each order
CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id integer REFERENCES public.products(id) ON DELETE SET NULL,
    quantity integer NOT NULL,
    price numeric(10, 2) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop old policies to prevent errors on script rerun
DROP POLICY IF EXISTS "Users can view their own orders." ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders." ON public.orders;
DROP POLICY IF EXISTS "Users can view items on their own orders." ON public.order_items;

-- Policies for 'orders' table
CREATE POLICY "Users can view their own orders." ON public.orders
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders." ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for 'order_items' table
CREATE POLICY "Users can view items on their own orders." ON public.order_items
    FOR SELECT USING ( (SELECT user_id FROM public.orders WHERE id = public.order_items.order_id) = auth.uid() );

-- Function to create an order and its items transactionally
CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items order_item_input[]
)
RETURNS text -- returns the new user-facing order_number
AS $$
DECLARE
  new_order_id bigint;
  new_order_number text;
  item public.order_item_input;
BEGIN
  -- Insert the order and get the new ID and order_number
  INSERT INTO public.orders (user_id, total_amount, shipping_details, status)
  VALUES (auth.uid(), p_total_amount, p_shipping_details, 'Pending')
  RETURNING id, order_number INTO new_order_id, new_order_number;

  -- Loop through the items and insert them
  IF array_length(p_items, 1) > 0 THEN
    FOREACH item IN ARRAY p_items
    LOOP
      INSERT INTO public.order_items (order_id, product_id, quantity, price)
      VALUES (new_order_id, item.product_id, item.quantity, item.price);
    END LOOP;
  END IF;

  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Grant permissions for authenticated users to use the function
GRANT EXECUTE ON FUNCTION public.create_order(numeric, jsonb, order_item_input[]) TO authenticated;
