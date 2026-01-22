-- This script fixes the function signature errors from the previous step.

-- 1. Add columns if they don't already exist from the previous attempt.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2);

-- 2. Drop existing functions to avoid signature mismatch errors.
-- The types of the arguments must be specified for Supabase to find the right function.
DROP FUNCTION IF EXISTS create_order(uuid, numeric, jsonb, jsonb, text, jsonb, text, numeric);
DROP FUNCTION IF EXISTS create_order(uuid, numeric, jsonb, jsonb, text, jsonb);
DROP FUNCTION IF EXISTS get_admin_order_details(text);

-- 3. Recreate the create_order function to handle discounts
CREATE OR REPLACE FUNCTION create_order(
    p_user_id uuid,
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb DEFAULT NULL,
    p_coupon_code text DEFAULT NULL,
    p_discount_amount numeric DEFAULT 0
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id bigint;
    order_number_text text;
BEGIN
    -- Generate a unique order number
    order_number_text := 'ORD-' || to_char(NOW(), 'YYMMDD') || '-' || substr(md5(random()::text), 1, 6);

    -- Insert into orders table
    INSERT INTO orders (user_id, total_amount, status, shipping_details, order_number, coupon_code, discount_amount)
    VALUES (p_user_id, p_total_amount, 'Pending', p_shipping_details, order_number_text, p_coupon_code, p_discount_amount)
    RETURNING id INTO new_order_id;

    -- Insert into order_items table
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    SELECT new_order_id, (item->>'product_id')::bigint, (item->>'quantity')::int, (item->>'price')::numeric
    FROM jsonb_array_elements(p_items) as item;

    -- Insert into transactions table. The amount should be the final amount paid.
    INSERT INTO transactions (order_id, user_id, amount, payment_method, status, transaction_details)
    VALUES (new_order_id, p_user_id, p_total_amount, p_payment_method, 'Completed', p_transaction_details);

    -- Decrement stock for each product
    UPDATE products
    SET stock = stock - (item->>'quantity')::int
    FROM jsonb_array_elements(p_items) as item
    WHERE products.id = (item->>'product_id')::bigint;

    RETURN order_number_text;
END;
$$;


-- 4. Recreate the admin order details function to include coupon info
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number TEXT)
RETURNS TABLE (
    id BIGINT,
    order_number TEXT,
    created_at TIMESTAMPTZ,
    total_amount NUMERIC,
    status order_status,
    shipping_details JSONB,
    profiles JSONB,
    order_items JSONB,
    coupon_code TEXT,
    discount_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        o.shipping_details,
        jsonb_build_object(
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ) AS profiles,
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', oi.id,
                'quantity', oi.quantity,
                'price_at_purchase', oi.price_at_purchase,
                'products', jsonb_build_object(
                    'name', pr.name,
                    'featured_image_url', pr.featured_image_url
                )
            )
        ) FROM order_items oi JOIN products pr ON oi.product_id = pr.id WHERE oi.order_id = o.id) AS order_items,
        o.coupon_code,
        o.discount_amount
    FROM
        orders o
    LEFT JOIN
        profiles p ON o.user_id = p.id
    WHERE
        o.order_number = p_order_number
    LIMIT 1;
END;
$$;
