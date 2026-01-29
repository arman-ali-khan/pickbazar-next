
-- This script will remove all conflicting versions of the 'create_order' function
-- and create a single, correct version to resolve the "could not choose best candidate" error.

-- It is safe to run this script multiple times. The 'IF EXISTS' clauses prevent errors
-- if a function doesn't exist.

-- Drop all known potentially conflicting function signatures.
-- The database might not have all of these, but we drop them to be safe.
-- Signature 1: p_discount_amount as text
DROP FUNCTION IF EXISTS public.create_order(numeric, jsonb, jsonb, text, jsonb, text, text, text);
-- Signature 2: p_discount_amount as numeric, p_initial_status as order_status enum
DROP FUNCTION IF EXISTS public.create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric, public.order_status);
-- Signature 3: p_discount_amount as numeric, p_initial_status as text (the correct one we will create)
DROP FUNCTION IF EXISTS public.create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric, text);
-- Signature 4: another permutation
DROP FUNCTION IF EXISTS public.create_order(numeric, jsonb, jsonb, text, jsonb, text, text, public.order_status);


-- Create the one, definitive 'create_order' function.
CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status text
)
RETURNS text -- The order_number
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id BIGINT;
  new_order_number TEXT;
  item JSONB;
  v_user_id UUID;
BEGIN
  -- Get user_id from the current session
  SELECT auth.uid() INTO v_user_id;

  -- If user is not logged in, throw an error
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User is not authenticated';
  END IF;

  -- Generate a unique order number. Example: 'KB-240725-101'
  -- This uses the existing sequence 'orders_id_seq' which is automatically created for the 'id' column.
  new_order_number := 'KB-' || to_char(now() AT TIME ZONE 'UTC', 'YYMMDD') || '-' || nextval('orders_id_seq');

  -- Insert the new order into the orders table
  INSERT INTO public.orders (
    user_id,
    order_number,
    total_amount,
    status,
    shipping_details,
    payment_method,
    payment_details,
    coupon_code,
    discount_amount
  ) VALUES (
    v_user_id,
    new_order_number,
    p_total_amount,
    p_initial_status::public.order_status, -- Cast the text status to the ENUM type
    p_shipping_details,
    p_payment_method,
    p_transaction_details,
    p_coupon_code,
    p_discount_amount
  ) RETURNING id INTO new_order_id;

  -- Loop through the items in the p_items JSON array and insert them
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      quantity,
      price_at_purchase
    ) VALUES (
      new_order_id,
      (item->>'product_id')::BIGINT,
      (item->>'quantity')::INTEGER,
      (item->>'price')::NUMERIC
    );

    -- Decrement the stock for the purchased product
    UPDATE public.products
    SET stock = stock - (item->>'quantity')::INTEGER
    WHERE id = (item->>'product_id')::BIGINT;
  END LOOP;

  -- Create an initial record in the order history
  INSERT INTO public.order_history (order_id, status)
  VALUES (new_order_id, p_initial_status::public.order_status);

  -- Return the generated order number
  RETURN new_order_number;
END;
$$;
