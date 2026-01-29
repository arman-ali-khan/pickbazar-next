-- This is a comprehensive script to fix all order-related database function issues.

-- Step 1: Drop all old and potentially conflicting functions.
-- We use IF EXISTS to prevent errors if a function doesn't exist.
DROP FUNCTION IF EXISTS get_admin_order_list();
DROP FUNCTION IF EXISTS get_admin_order_details(text);
DROP FUNCTION IF EXISTS update_order_status_and_log(bigint, public.order_status);
DROP FUNCTION IF EXISTS update_order_status_and_log(bigint, text);
DROP FUNCTION IF EXISTS create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric, public.order_status);
DROP FUNCTION IF EXISTS create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric, text);


-- Step 2: Ensure the 'orders' table has the necessary columns.
-- This prevents "column does not exist" errors.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_details jsonb;


-- Step 3: Re-create all functions with their correct and final definitions.

-- Function to get the list of orders for the admin dashboard.
CREATE OR REPLACE FUNCTION get_admin_order_list()
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount numeric,
    status public.order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        COALESCE(p.full_name, (o.shipping_details->>'firstName' || ' ' || o.shipping_details->>'lastName')) AS customer_name,
        COALESCE(u.email, o.shipping_details->>'email') AS customer_email,
        p.avatar_url AS customer_avatar_url
    FROM
        orders o
    LEFT JOIN
        profiles p ON o.user_id = p.id
    LEFT JOIN
        auth.users u ON o.user_id = u.id
    ORDER BY
        o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get the detailed view of a single order for the admin dashboard.
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount numeric,
    status public.order_status,
    shipping_details jsonb,
    profiles jsonb,
    order_items jsonb,
    coupon_code text,
    discount_amount numeric,
    payment_method text,
    transaction_details jsonb
) AS $$
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
            'full_name', COALESCE(p.full_name, (o.shipping_details->>'firstName' || ' ' || o.shipping_details->>'lastName')),
            'avatar_url', p.avatar_url
        ) as profiles,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', oi.id,
                    'quantity', oi.quantity,
                    'price_at_purchase', oi.price_at_purchase,
                    'products', jsonb_build_object(
                        'name', pr.name,
                        'featured_image_url', pr.featured_image_url
                    )
                )
            )
            FROM order_items oi
            JOIN products pr ON oi.product_id = pr.id
            WHERE oi.order_id = o.id
        ) as order_items,
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.payment_details as transaction_details
    FROM orders o
    LEFT JOIN profiles p ON o.user_id = p.id
    WHERE o.order_number = p_order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to update an order's status and log the change.
CREATE OR REPLACE FUNCTION update_order_status_and_log(p_order_id bigint, p_new_status text)
RETURNS SETOF orders AS $$
DECLARE
    new_status public.order_status := p_new_status::public.order_status;
BEGIN
    UPDATE orders
    SET status = new_status
    WHERE id = p_order_id;

    INSERT INTO order_history (order_id, status)
    VALUES (p_order_id, new_status);

    RETURN QUERY
    SELECT * FROM orders WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to create a new order and its associated items.
CREATE OR REPLACE FUNCTION create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status text
)
RETURNS text AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item record;
BEGIN
    INSERT INTO orders (
        user_id,
        total_amount,
        shipping_details,
        status,
        payment_method,
        payment_details,
        coupon_code,
        discount_amount
    )
    VALUES (
        auth.uid(),
        p_total_amount,
        p_shipping_details,
        p_initial_status::public.order_status,
        p_payment_method,
        p_transaction_details,
        p_coupon_code,
        p_discount_amount
    )
    RETURNING id, order_number INTO new_order_id, new_order_number;

    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id bigint, quantity int, price numeric)
    LOOP
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, item.product_id, item.quantity, item.price);
    END LOOP;

    INSERT INTO order_history (order_id, status)
    VALUES (new_order_id, p_initial_status::public.order_status);

    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Step 4: Grant permissions to the newly created functions.
GRANT EXECUTE ON FUNCTION get_admin_order_list() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_order_details(text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_status_and_log(bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric, text) TO authenticated;

-- Grant usage on the order_status type to necessary roles
GRANT USAGE ON TYPE public.order_status TO authenticated;
GRANT USAGE ON TYPE public.order_status TO service_role;

-- Grant permissions for authenticated users to access user data via security definer functions
GRANT SELECT (id, full_name, avatar_url) ON public.profiles TO authenticated;
GRANT SELECT (id, email) ON auth.users TO authenticated;
