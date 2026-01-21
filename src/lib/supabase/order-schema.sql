-- Drop all possible old versions of the function and type to resolve ambiguity.
-- Using CASCADE to remove any dependencies.
DROP FUNCTION IF EXISTS public.create_order(uuid, numeric, jsonb, public.order_item_input[]) CASCADE;
DROP FUNCTION IF EXISTS public.create_order(uuid, numeric, jsonb, json) CASCADE;
DROP FUNCTION IF EXISTS public.create_order(uuid, numeric, jsonb, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.create_order(numeric, jsonb, jsonb) CASCADE;
DROP TYPE IF EXISTS public.order_item_input CASCADE;

-- Create a sequence for order numbers if it doesn't exist
-- This ensures our order numbers are unique and sequential
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'orders_id_seq') THEN
    CREATE SEQUENCE orders_id_seq;
  END IF;
END
$$;

-- Create the orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number text UNIQUE,
    total_amount numeric(10, 2) NOT NULL,
    status text NOT NULL DEFAULT 'Pending',
    shipping_details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create the order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id integer REFERENCES public.products(id) ON DELETE SET NULL,
    quantity integer NOT NULL,
    price numeric(10, 2) NOT NULL
);


-- Recreate the definitive create_order function
create or replace function public.create_order(
  p_user_id uuid,
  p_total_amount numeric,
  p_shipping_details jsonb,
  p_items jsonb
)
returns text
language plpgsql
security definer
as $$
declare
  new_order_id int;
  new_order_number text;
  item record;
begin
  -- Generate a unique order number. We use the sequence to ensure uniqueness.
  new_order_number := 'ORD-' || to_char(now(), 'YYMMDD') || '-' || nextval('orders_id_seq');

  -- Insert the new order
  insert into public.orders (user_id, total_amount, status, shipping_details, order_number)
  values (p_user_id, p_total_amount, 'Pending', p_shipping_details, new_order_number)
  returning id into new_order_id;

  -- Insert order items by iterating through the JSONB array
  -- This is a robust way to handle the items array passed from the client
  for item in select * from jsonb_to_recordset(p_items) as x(product_id int, quantity int, price numeric) loop
    insert into public.order_items (order_id, product_id, quantity, price)
    values (new_order_id, item.product_id, item.quantity, item.price);
  end loop;

  return new_order_number;
end;
$$;