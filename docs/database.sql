-- ----------------------------------------------------------------
-- DATABASE MIGRATION SCRIPT
--
-- This script contains all necessary functions and triggers for
-- the application. It is designed to clean up any previous
-- inconsistencies and set up the database correctly.
--
-- You can run this entire script safely in your Supabase SQL Editor.
-- ----------------------------------------------------------------


-- ----------------------------------------------------------------
-- 1. CLEANUP: Drop old and conflicting objects
-- ----------------------------------------------------------------

-- Drop the order status logging function and its dependent trigger
DROP FUNCTION IF EXISTS public.log_order_status_change() CASCADE;

-- Drop all potentially conflicting versions of update_order_status_and_log
-- We must specify argument types to resolve ambiguity.
DROP FUNCTION IF EXISTS public.update_order_status_and_log(bigint, public.order_status);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(bigint, text);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(integer, text);


-- ----------------------------------------------------------------
-- 2. ENUMS AND TYPES
-- ----------------------------------------------------------------
-- (Assuming these types exist. If not, they would be created here.
-- The app likely already has them.)
-- CREATE TYPE public.order_status AS ENUM ...
-- CREATE TYPE public.user_role AS ENUM ...


-- ----------------------------------------------------------------
-- 3. FUNCTIONS
-- ----------------------------------------------------------------

-- Helper function to log order status changes to the history table
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.order_history(order_id, status)
    VALUES(NEW.id, NEW.status);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get a user's wishlist IDs
CREATE OR REPLACE FUNCTION public.get_user_wishlist_ids(p_user_id uuid)
RETURNS TABLE (product_id integer) AS $$
BEGIN
    RETURN QUERY
    SELECT w.product_id
    FROM public.wishlist w
    WHERE w.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to toggle a product in a user's wishlist
CREATE OR REPLACE FUNCTION public.toggle_wishlist_item(p_user_id uuid, p_product_id integer)
RETURNS json AS $$
DECLARE
    item_exists boolean;
    result_status text;
BEGIN
    SELECT EXISTS(SELECT 1 FROM wishlist WHERE user_id = p_user_id AND product_id = p_product_id) INTO item_exists;

    IF item_exists THEN
        DELETE FROM wishlist WHERE user_id = p_user_id AND product_id = p_product_id;
        result_status := 'removed';
    ELSE
        INSERT INTO wishlist (user_id, product_id) VALUES (p_user_id, p_product_id);
        result_status := 'added';
    END IF;

    RETURN json_build_object('status', result_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to create a new order and its items in a transaction
CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount double precision,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount double precision,
    p_initial_status public.order_status
)
RETURNS text AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item record;
    current_user_id uuid := auth.uid();
BEGIN
    -- Generate a unique order number
    new_order_number := 'PB-' || to_char(now(), 'YYMMDD') || '-' || substr(md5(random()::text), 1, 6);

    -- Insert the order and get the new ID
    INSERT INTO public.orders (
        user_id, total_amount, status, shipping_details, coupon_code, discount_amount
    ) VALUES (
        current_user_id, p_total_amount, p_initial_status, p_shipping_details, p_coupon_code, p_discount_amount
    ) RETURNING id INTO new_order_id;
    
    -- Update the order with the generated order number
    UPDATE public.orders SET order_number = new_order_number WHERE id = new_order_id;

    -- Insert order items
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id int, quantity int, price double precision)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, item.product_id, item.quantity, item.price);
    END LOOP;
    
    -- Insert transaction details if provided
    IF p_payment_method IS NOT NULL THEN
        INSERT INTO public.transactions(order_id, user_id, amount, payment_method, transaction_details, status)
        VALUES (new_order_id, current_user_id, p_total_amount, p_payment_method, p_transaction_details, 'Completed');
    END IF;

    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to update an order's status AND log it to history
-- This is the single, correct version.
CREATE OR REPLACE FUNCTION public.update_order_status_and_log(
    p_order_id bigint,
    p_new_status text
)
RETURNS TABLE (
    user_id uuid,
    order_number text
) AS $$
DECLARE
    order_user_id uuid;
    order_num text;
BEGIN
    UPDATE public.orders
    SET status = p_new_status::public.order_status
    WHERE id = p_order_id
    RETURNING orders.user_id, orders.order_number INTO order_user_id, order_num;
    
    RETURN QUERY SELECT order_user_id, order_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get related products with fallback logic
CREATE OR REPLACE FUNCTION get_related_products(p_id integer, p_limit integer)
RETURNS TABLE(
    id integer,
    name text,
    price double precision,
    original_price double precision,
    featured_image_url text,
    unit text
) AS $$
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
            p.name,
            p.price,
            p.original_price,
            p.featured_image_url,
            p.unit,
            p.created_at,
            (
                (SELECT COUNT(*) FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id IN (SELECT category_id FROM product_cats)) * 2 +
                (SELECT COUNT(*) FROM product_tags pt WHERE pt.product_id = p.id AND pt.tag_id IN (SELECT tag_id FROM product_tags_list))
            ) as relevance_score
        FROM products p
        WHERE p.id != p_id AND p.status = 'active'
    )
    -- First, try to get products with a relevance score > 0
    (SELECT sp.id, sp.name, sp.price, sp.original_price, sp.featured_image_url, sp.unit
     FROM scored_products sp
     WHERE sp.relevance_score > 0
     ORDER BY sp.relevance_score DESC, sp.created_at DESC
     LIMIT p_limit)
    UNION ALL
    -- Fallback: If not enough related products, fill with most recent products from the same primary category
    (SELECT p.id, p.name, p.price, p.original_price, p.featured_image_url, p.unit
     FROM products p
     JOIN product_categories pc ON p.id = pc.product_id
     WHERE p.status = 'active'
       AND p.id != p_id
       AND pc.category_id IN (SELECT category_id FROM product_cats)
       AND p.id NOT IN (SELECT s.id FROM scored_products s WHERE s.relevance_score > 0) -- Exclude already selected
     ORDER BY p.created_at DESC
     LIMIT p_limit)
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get recommended products with fallback logic
CREATE OR REPLACE FUNCTION get_recommended_products(p_limit integer)
RETURNS TABLE(
    id integer,
    name text,
    price double precision,
    original_price double precision,
    featured_image_url text,
    unit text
) AS $$
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
            p.view_count,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) as sales_count,
            (SELECT COUNT(*) FROM wishlist w WHERE w.product_id = p.id) as wishlist_count,
            -- Weighted score: Sales (50%), Wishlists (30%), Views (20%)
            (
                (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) * 0.5 +
                (SELECT COUNT(*) FROM wishlist w WHERE w.product_id = p.id) * 0.3 +
                COALESCE(p.view_count, 0) * 0.2
            ) as weighted_score
        FROM products p
        WHERE p.status = 'active'
    )
    -- First, try to get products with a score > 0
    (SELECT ps.id, ps.name, ps.price, ps.original_price, ps.featured_image_url, ps.unit
     FROM product_scores ps
     WHERE ps.weighted_score > 0
     ORDER BY ps.weighted_score DESC, ps.created_at DESC
     LIMIT p_limit)
    UNION ALL
    -- Fallback: if not enough scored products, fill with most recent products
    (SELECT p.id, p.name, p.price, p.original_price, p.featured_image_url, p.unit
     FROM products p
     WHERE p.status = 'active' AND p.id NOT IN (SELECT s.id FROM product_scores s WHERE s.weighted_score > 0) -- Exclude already selected
     ORDER BY p.created_at DESC
     LIMIT p_limit)
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Other helper functions for admin panel and user profiles
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount double precision,
    status public.order_status,
    shipping_details jsonb,
    profiles json,
    order_items json,
    coupon_code text,
    discount_amount double precision,
    payment_method text,
    transaction_details jsonb
)
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
        json_build_object('full_name', p.full_name, 'avatar_url', p.avatar_url) as profiles,
        (SELECT json_agg(
            json_build_object(
                'id', oi.id,
                'quantity', oi.quantity,
                'price_at_purchase', oi.price_at_purchase,
                'products', json_build_object(
                    'name', pr.name,
                    'featured_image_url', pr.featured_image_url
                )
            )
        ) FROM order_items oi JOIN products pr ON oi.product_id = pr.id WHERE oi.order_id = o.id) as order_items,
        o.coupon_code,
        o.discount_amount,
        t.payment_method,
        t.transaction_details
    FROM orders o
    LEFT JOIN profiles p ON o.user_id = p.id
    LEFT JOIN transactions t ON o.id = t.order_id
    WHERE o.order_number = p_order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_order_history(p_order_id bigint)
RETURNS TABLE (
    status public.order_status,
    created_at timestamp with time zone
)
AS $$
BEGIN
    RETURN QUERY
    SELECT oh.status, oh.created_at
    FROM order_history oh
    WHERE oh.order_id = p_order_id
    ORDER BY oh.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    avatar_url text,
    role public.user_role,
    created_at timestamp with time zone
)
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email, p.full_name, p.avatar_url, p.role, u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_all_settings()
RETURNS TABLE(settings jsonb)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT jsonb_object_agg(key, value)
  FROM public.settings;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_category_tree()
RETURNS TABLE(name text, subcategories json)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE category_hierarchy AS (
    SELECT
      id,
      name,
      parent_id,
      1 as level,
      name::text as path
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    SELECT
      c.id,
      c.name,
      c.parent_id,
      ch.level + 1,
      ch.path || ' -> ' || c.name
    FROM categories c
    JOIN category_hierarchy ch ON c.parent_id = ch.id
  )
  SELECT
    p.name,
    (SELECT json_agg(c.name) FROM category_hierarchy c WHERE c.parent_id = p.id) as subcategories
  FROM category_hierarchy p
  WHERE p.parent_id IS NULL
  ORDER BY p.name;
END;
$$;


-- ----------------------------------------------------------------
-- 4. TRIGGERS
-- ----------------------------------------------------------------

-- Trigger to log status changes on the orders table
CREATE TRIGGER log_order_status_change_trigger
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();


-- ----------------------------------------------------------------
-- SCRIPT END
-- ----------------------------------------------------------------
