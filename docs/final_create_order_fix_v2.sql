-- Drops the old function if it exists to prevent signature conflicts
DROP FUNCTION IF EXISTS public.create_new_order(
    p_total_amount numeric,
    p_shipping_details jsonb, 
    p_items jsonb, 
    p_payment_method text, 
    p_transaction_details jsonb, 
    p_coupon_code text, 
    p_discount_amount numeric, 
    p_initial_status public.order_status
);

-- Creates the new, correct function that properly handles ID generation and avoids conflicts.
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
RETURNS text -- The order number
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    order_item jsonb;
BEGIN
    -- Insert the order and get the new auto-generated ID.
    INSERT INTO public.orders (
        user_id,
        total_amount, 
        status,
        shipping_details,
        payment_method,
        payment_details,
        coupon_code,
        discount_amount
    )
    VALUES (
        p_user_id,
        p_total_amount,
        p_initial_status,
        p_shipping_details,
        p_payment_method,
        p_transaction_details,
        p_coupon_code,
        p_discount_amount
    )
    RETURNING id INTO new_order_id;
    
    -- Generate a unique order number based on the new ID.
    new_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || lpad(new_order_id::text, 6, '0');

    -- Update the order with the generated order number.
    UPDATE public.orders
    SET order_number = new_order_number
    WHERE id = new_order_id;

    -- Insert order items.
    FOR order_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, (order_item->>'product_id')::bigint, (order_item->>'quantity')::integer, (order_item->>'price')::numeric);
    END LOOP;

    -- Insert into order history.
    INSERT INTO public.order_history (order_id, status)
    VALUES (new_order_id, p_initial_status);

    RETURN new_order_number;
END;
$$;