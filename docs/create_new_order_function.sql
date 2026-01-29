-- This function creates a new order, associated order items, and an initial history record.
-- It is named `create_new_order` to avoid conflicts with previously defined, broken functions.
CREATE OR REPLACE FUNCTION public.create_new_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status public.order_status
)
RETURNS text -- Returns the new order number
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    v_user_id uuid;
    item jsonb;
BEGIN
    -- Get the user ID from the session. A user must be logged in to create an order.
    SELECT auth.uid() INTO v_user_id;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be logged in to create an order.';
    END IF;

    -- Generate a unique order number
    new_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || nextval('orders_id_seq');

    -- Insert the order
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
    )
    VALUES (
        v_user_id,
        new_order_number,
        p_total_amount,
        p_initial_status,
        p_shipping_details,
        p_payment_method,
        p_transaction_details,
        p_coupon_code,
        p_discount_amount
    )
    RETURNING id INTO new_order_id;

    -- Insert order items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            price_at_purchase
        )
        VALUES (
            new_order_id,
            (item->>'product_id')::bigint,
            (item->>'quantity')::integer,
            (item->>'price')::numeric
        );
    END LOOP;

    -- Create initial order history record
    INSERT INTO public.order_history (order_id, status, notes)
    VALUES (new_order_id, p_initial_status, 'Order created.');

    -- Return the new order number
    RETURN new_order_number;
END;
$$;
