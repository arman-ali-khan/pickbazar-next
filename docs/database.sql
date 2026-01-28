-- ----------------------------------------------------------------
-- DATABASE MIGRATION: ADVANCED PRODUCT RECOMMENDATION ALGORITHMS
--
-- This script updates and adds functions for fetching related and
-- recommended products. You can run this script safely in your
-- Supabase SQL Editor.
-- ----------------------------------------------------------------
-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.get_related_products(integer,integer);
DROP FUNCTION IF EXISTS public.get_recommended_products(integer);
DROP FUNCTION IF EXISTS public.create_order(uuid,double precision,jsonb,jsonb,text,jsonb,double precision,public.order_status);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(bigint,public.order_status);
DROP FUNCTION IF EXISTS public.get_admin_order_details(text);

-- Create custom types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM (
            'Pending',
            'Processing',
            'Shipped',
            'Delivered',
            'Cancelled',
            'Failed'
        );
    END IF;
END$$;


-- Function to get related products based on shared categories and tags
-- This function scores products based on shared categories (2 points) and tags (1 point).
CREATE OR REPLACE FUNCTION get_related_products(p_id integer, p_limit integer)
RETURNS TABLE(
    id integer,
    name text,
    price double precision,
    original_price double precision,
    featured_image_url text,
    unit text
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH product_cats AS (
        SELECT category_id FROM product_categories WHERE product_id = p_id
    ),
    product_tags_list AS (
        SELECT tag_id FROM product_tags WHERE product_id = p_id
    ),
    scored_products AS (
        SELECT
            p.id,
            (
                (SELECT COUNT(*) FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id IN (SELECT category_id FROM product_cats)) * 2 +
                (SELECT COUNT(*) FROM product_tags pt WHERE pt.product_id = p.id AND pt.tag_id IN (SELECT tag_id FROM product_tags_list))
            ) as relevance_score
        FROM products p
        WHERE p.id != p_id AND p.status = 'active'
    )
    SELECT
        p.id,
        p.name,
        p.price,
        p.original_price,
        p.featured_image_url,
        p.unit
    FROM
        products p
    JOIN scored_products sp ON p.id = sp.product_id
    WHERE sp.relevance_score > 0
    ORDER BY
        sp.relevance_score DESC, p.view_count DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- Function to get recommended products
-- This uses a fallback mechanism: first tries to find products based on user interactions,
-- then falls back to most viewed, then to most recent.
CREATE OR REPLACE FUNCTION get_recommended_products(p_limit integer)
RETURNS TABLE(
    id integer,
    name text,
    price double precision,
    original_price double precision,
    featured_image_url text,
    unit text
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH product_scores AS (
        SELECT
            p.id,
            p.name,
            p.price,
            p.original_price,
            p.featured_image_url,
            p.unit,
            p.created_at,
            -- Calculate a score based on views, sales, and wishlists
            (COALESCE(p.view_count, 0) * 0.2) +
            ((SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) * 0.5) +
            ((SELECT COUNT(*) FROM wishlist w WHERE w.product_id = p.id) * 0.3) as score
        FROM products p
        WHERE p.status = 'active'
    )
    -- First, try to return products with a score > 0
    SELECT ps.id, ps.name, ps.price, ps.original_price, ps.featured_image_url, ps.unit
    FROM product_scores ps
    WHERE ps.score > 0
    ORDER BY ps.score DESC, ps.created_at DESC
    LIMIT p_limit;

    -- If the above returns no rows, fall back to most recent products
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT
            p.id,
            p.name,
            p.price,
            p.original_price,
            p.featured_image_url,
            p.unit
        FROM products p
        WHERE p.status = 'active'
        ORDER BY p.created_at DESC
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- Helper function to generate a short, unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_order_number TEXT;
    is_unique BOOLEAN;
BEGIN
    is_unique := false;
    WHILE NOT is_unique LOOP
        new_order_number := 'KB-' || substr(upper(md5(random()::text)), 1, 6);
        PERFORM 1 FROM orders WHERE order_number = new_order_number;
        IF NOT FOUND THEN
            is_unique := true;
        END IF;
    END LOOP;
    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;


-- Creates an order and a corresponding transaction
CREATE OR REPLACE FUNCTION create_order(
    p_total_amount double precision,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount double precision,
    p_initial_status public.order_status DEFAULT 'Pending'
)
RETURNS text AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item_record jsonb;
    current_user_id uuid;
BEGIN
    -- Get the current user's ID from the auth session
    current_user_id := auth.uid();

    -- Generate a unique order number
    new_order_number := generate_order_number();

    -- Insert into orders table
    INSERT INTO orders(user_id, order_number, total_amount, shipping_details, coupon_code, discount_amount, status)
    VALUES (current_user_id, new_order_number, p_total_amount, p_shipping_details, p_coupon_code, p_discount_amount, p_initial_status)
    RETURNING id INTO new_order_id;

    -- Insert into order_items table
    FOR item_record IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items(order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, (item_record->>'product_id')::bigint, (item_record->>'quantity')::integer, (item_record->>'price')::double precision);
        
        -- Decrement product stock
        UPDATE products
        SET stock = stock - (item_record->>'quantity')::integer
        WHERE id = (item_record->>'product_id')::bigint;
    END LOOP;

    -- Insert into transactions table
    INSERT INTO transactions(order_id, user_id, amount, payment_method, transaction_details, status)
    VALUES (new_order_id, current_user_id, p_total_amount, p_payment_method, p_transaction_details, 'Completed');

    -- Insert into order_history
    INSERT INTO order_history (order_id, status)
    VALUES (new_order_id, p_initial_status);

    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;


-- Updates an order's status and logs the change in order_history
CREATE OR REPLACE FUNCTION update_order_status_and_log(p_order_id bigint, p_new_status public.order_status)
RETURNS SETOF orders AS $$
DECLARE
    updated_order orders;
BEGIN
    -- Update the order status
    UPDATE orders
    SET status = p_new_status
    WHERE id = p_order_id
    RETURNING * INTO updated_order;

    -- Log the status change in the history table
    INSERT INTO order_history (order_id, status)
    VALUES (p_order_id, p_new_status);

    -- Return the updated order
    RETURN NEXT updated_order;
END;
$$ LANGUAGE plpgsql;

-- Functions for retrieving order details
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount double precision,
    status order_status,
    shipping_details jsonb,
    coupon_code text,
    discount_amount double precision,
    payment_method text,
    transaction_details jsonb,
    profiles jsonb,
    order_items jsonb
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH order_items_agg AS (
        SELECT
            oi.order_id,
            jsonb_agg(
                jsonb_build_object(
                    'id', oi.id,
                    'quantity', oi.quantity,
                    'price_at_purchase', oi.price_at_purchase,
                    'products', jsonb_build_object(
                        'name', p.name,
                        'featured_image_url', p.featured_image_url
                    )
                )
            ) as items_json
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        GROUP BY oi.order_id
    )
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        o.shipping_details,
        o.coupon_code,
        o.discount_amount,
        t.payment_method,
        t.transaction_details,
        jsonb_build_object(
            'full_name', pr.full_name,
            'avatar_url', pr.avatar_url
        ),
        oia.items_json
    FROM orders o
    LEFT JOIN profiles pr ON o.user_id = pr.id
    LEFT JOIN transactions t ON o.id = t.order_id
    LEFT JOIN order_items_agg oia ON o.id = oia.order_id
    WHERE o.order_number = p_order_number;
END;
$$ LANGUAGE plpgsql;
