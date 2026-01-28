-- ----------------------------------------------------------------
-- DATABASE MIGRATION: COMPLETE SCHEMA & FUNCTIONS
--
-- This script contains the full schema and function definitions
-- required for the application to run correctly. It has been
-- cleaned up to remove conflicts and errors.
--
-- You can run this script safely in your Supabase SQL Editor.
-- Running this will reset functions and triggers to a known good state.
-- ----------------------------------------------------------------


-- ----------------------------------------------------------------
-- TYPES
-- ----------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Failed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE review_status AS ENUM ('Pending', 'Approved', 'Hidden');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_status') THEN
        CREATE TYPE question_status AS ENUM ('Pending', 'Answered');
    END IF;
END$$;


-- ----------------------------------------------------------------
-- CLEANUP: Drop functions and triggers before recreating
-- This section safely removes old objects to prevent conflicts.
-- ----------------------------------------------------------------
DROP TRIGGER IF EXISTS log_order_status_change_trigger ON public.orders;
DROP FUNCTION IF EXISTS public.log_order_status_change();
DROP FUNCTION IF EXISTS public.get_admin_order_details(p_order_number text);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(p_order_id bigint, p_new_status text);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(p_order_id bigint, p_new_status public.order_status);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(p_order_id integer, p_new_status text);
DROP FUNCTION IF EXISTS public.get_recommended_products(integer);
DROP FUNCTION IF EXISTS public.get_related_products(integer, integer);


-- ----------------------------------------------------------------
-- Add view_count to products table if it doesn't exist
-- ----------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name = 'view_count'
    ) THEN
        ALTER TABLE public.products ADD COLUMN view_count integer DEFAULT 0;
    END IF;
END$$;


-- ----------------------------------------------------------------
-- CORE FUNCTIONS
-- ----------------------------------------------------------------

-- Function to log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO order_history(order_id, status)
    VALUES (NEW.id, NEW.status);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log order status changes
CREATE TRIGGER log_order_status_change_trigger
AFTER INSERT OR UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();


-- Function to get admin order details
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount double precision,
    status order_status,
    shipping_details jsonb,
    profiles jsonb,
    order_items jsonb,
    coupon_code text,
    discount_amount double precision,
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
        jsonb_build_object('full_name', p.full_name, 'avatar_url', p.avatar_url) as profiles,
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
        ) FROM order_items oi JOIN products pr ON oi.product_id = pr.id WHERE oi.order_id = o.id) as order_items,
        o.coupon_code,
        o.discount_amount,
        (SELECT t.payment_method FROM transactions t WHERE t.order_id = o.id LIMIT 1) as payment_method,
        (SELECT t.transaction_details FROM transactions t WHERE t.order_id = o.id LIMIT 1) as transaction_details
    FROM orders o
    LEFT JOIN profiles p ON o.user_id = p.id
    WHERE o.order_number = p_order_number;
END;
$$ LANGUAGE plpgsql;


-- Function to update order status and log it
CREATE OR REPLACE FUNCTION update_order_status_and_log(p_order_id bigint, p_new_status text)
RETURNS SETOF orders AS $$
DECLARE
    new_status_enum order_status;
BEGIN
    new_status_enum := p_new_status::order_status;
    RETURN QUERY
    UPDATE orders
    SET status = new_status_enum
    WHERE id = p_order_id
    RETURNING *;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------
-- PRODUCT RECOMMENDATION & RELATED FUNCTIONS (Corrected)
-- ----------------------------------------------------------------

-- Function to get related products based on shared categories and tags
-- This version is more resilient and includes fallbacks.
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
            p.id as product_id,
            (
                (SELECT COUNT(*) FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id IN (SELECT category_id FROM product_cats)) * 2 +
                (SELECT COUNT(*) FROM product_tags pt WHERE pt.product_id = p.id AND pt.tag_id IN (SELECT tag_id FROM product_tags_list))
            ) as relevance_score
        FROM products p
        WHERE p.id != p_id AND p.status = 'active'
    )
    -- This combined query first gets scored products, then fills with popular ones if needed.
    SELECT * FROM (
        (SELECT
            p.id, p.name, p.price, p.original_price, p.featured_image_url, p.unit
        FROM products p
        JOIN scored_products sp ON p.id = sp.product_id
        WHERE sp.relevance_score > 0
        ORDER BY sp.relevance_score DESC, p.view_count DESC NULLS LAST
        LIMIT p_limit)

        UNION ALL

        (SELECT
            p.id, p.name, p.price, p.original_price, p.featured_image_url, p.unit
        FROM products p
        WHERE
            p.id != p_id
            AND p.status = 'active'
            AND p.id NOT IN (SELECT sp.product_id FROM scored_products sp WHERE sp.relevance_score > 0)
        ORDER BY p.view_count DESC NULLS LAST, p.created_at DESC
        LIMIT p_limit)
    ) as related
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;


-- Function to get recommended products based on views, sales, and wishlist counts
-- CORRECTED VERSION: Includes created_at in the CTE.
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
    -- Fallback to most recent products if there is no activity
    IF (SELECT COUNT(*) FROM orders) = 0 AND (SELECT COUNT(*) FROM wishlist) = 0 THEN
        RETURN QUERY
        SELECT p.id, p.name, p.price, p.original_price, p.featured_image_url, p.unit
        FROM products p
        WHERE p.status = 'active'
        ORDER BY p.created_at DESC
        LIMIT p_limit;
        RETURN;
    END IF;

    RETURN QUERY
    WITH product_scores AS (
        SELECT
            p.id,
            p.name,
            p.price,
            p.original_price,
            p.featured_image_url,
            p.unit,
            p.view_count,
            p.created_at, -- This was the missing column
            (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) as sales_count,
            (SELECT COUNT(*) FROM wishlist w WHERE w.product_id = p.id) as wishlist_count
        FROM
            products p
        WHERE p.status = 'active'
    )
    SELECT
        ps.id,
        ps.name,
        ps.price,
        ps.original_price,
        ps.featured_image_url,
        ps.unit
    FROM
        product_scores ps
    ORDER BY
        (ps.sales_count * 0.5) + (ps.wishlist_count * 0.3) + (COALESCE(ps.view_count, 0) * 0.2) DESC,
        ps.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;
