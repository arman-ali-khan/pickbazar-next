
-- Drop the old function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.create_new_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status);

-- Create the new, corrected function
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
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item record;
    current_user_id uuid := auth.uid();
BEGIN
    -- Insert the order and get the new ID and order_number
    INSERT INTO public.orders (
        user_id,
        total_amount,
        status,
        shipping_details,
        payment_method,
        payment_details,
        coupon_code,
        discount_amount
    ) VALUES (
        current_user_id,
        p_total_amount,
        p_initial_status,
        p_shipping_details,
        p_payment_method,
        p_transaction_details,
        p_coupon_code,
        p_discount_amount
    ) RETURNING id, order_number INTO new_order_id, new_order_number;

    -- Insert order history
    INSERT INTO public.order_history (order_id, status)
    VALUES (new_order_id, p_initial_status);

    -- Insert order items and update stock
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id int, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            price_at_purchase
        ) VALUES (
            new_order_id,
            item.product_id,
            item.quantity,
            item.price
        );

        -- Decrease stock
        UPDATE public.products
        SET stock = stock - item.quantity
        WHERE id = item.product_id;
    END LOOP;

    -- Return the generated order number
    RETURN new_order_number;
END;
$$;
