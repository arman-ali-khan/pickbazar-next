
DROP FUNCTION IF EXISTS public.create_new_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status);

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
RETURNS text -- returns the new order_number
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    user_uuid uuid;
    item record;
BEGIN
    -- Get user id from session if available
    user_uuid := auth.uid();
    
    -- Generate a unique order number.
    -- This assumes a sequence named 'orders_order_number_seq' exists.
    new_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || lpad( (nextval('public.orders_order_number_seq'::regclass))::text, 6, '0');

    -- Insert the new order and get its generated ID
    INSERT INTO public.orders (
        user_id,
        total_amount,
        shipping_details,
        status,
        payment_method,
        payment_details,
        coupon_code,
        discount_amount,
        order_number
    )
    VALUES (
        user_uuid,
        p_total_amount,
        p_shipping_details,
        p_initial_status,
        p_payment_method,
        p_transaction_details,
        p_coupon_code,
        p_discount_amount,
        new_order_number
    )
    RETURNING id INTO new_order_id;

    -- Insert order items
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id bigint, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            price_at_purchase
        )
        VALUES (
            new_order_id,
            item.product_id,
            item.quantity,
            item.price
        );
    END LOOP;
    
    -- Log the initial status in order_history
    INSERT INTO public.order_history(order_id, status)
    VALUES (new_order_id, p_initial_status);

    RETURN new_order_number;
END;
$$;
