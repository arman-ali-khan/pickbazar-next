
-- ----------------------------------------------------------------
-- DATABASE MIGRATION: FIX PRODUCT RECOMMENDATION ALGORITHMS & AMBIGUITY
--
-- This script fixes permissions for the product recommendation
-- functions, adds the `view_count` column, and resolves the
-- function ambiguity error for `update_order_status_and_log`.
-- You can run this script safely in your Supabase SQL Editor.
-- ----------------------------------------------------------------

-- Add view_count column to products table if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Drop conflicting functions first to resolve ambiguity
-- CORRECTED SYNTAX: Using types only, no parameter names.
DROP FUNCTION IF EXISTS public.update_order_status_and_log(bigint, public.order_status);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(bigint, text);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(integer, text);

-- Recreate the single correct version of update_order_status_and_log
CREATE OR REPLACE FUNCTION public.update_order_status_and_log(p_order_id bigint, p_new_status text)
 RETURNS TABLE(order_number text, user_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_order orders;
BEGIN
    -- Update the order status
    UPDATE orders
    SET status = p_new_status::order_status
    WHERE id = p_order_id
    RETURNING * INTO v_order;

    -- The trigger `log_order_status_change_trigger` will automatically log the history.

    -- Return the order number and user_id for notification purposes
    RETURN QUERY SELECT v_order.order_number, v_order.user_id;
END;
$function$;


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
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH product_cats AS (
        SELECT category_id FROM product_categories WHERE product_id = p_id
    ),
    product_tags_list AS (
        SELECT tag_id FROM product_tags WHERE product_id = p_id
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
    -- Subquery to calculate relevance score
    LEFT JOIN (
        SELECT
            p_rel.id as product_id,
            (
                (SELECT COUNT(*) FROM product_categories pc WHERE pc.product_id = p_rel.id AND pc.category_id IN (SELECT category_id FROM product_cats)) * 2 +
                (SELECT COUNT(*) FROM product_tags pt WHERE pt.product_id = p_rel.id AND pt.tag_id IN (SELECT tag_id FROM product_tags_list))
            ) as relevance_score
        FROM products p_rel
        WHERE p_rel.id != p_id AND p_rel.status = 'active'
    ) AS relevance ON p.id = relevance.product_id
    WHERE
        p.id != p_id
        AND p.status = 'active'
        AND relevance.relevance_score > 0
    ORDER BY
        relevance.relevance_score DESC, p.view_count DESC NULLS LAST
    LIMIT p_limit;
END;
$$;


-- Function to get recommended products based on views, sales, and wishlist counts
-- This function calculates a weighted score for each product to determine recommendations.
CREATE OR REPLACE FUNCTION get_recommended_products(p_limit integer)
RETURNS TABLE(
    id integer,
    name text,
    price double precision,
    original_price double precision,
    featured_image_url text,
    unit text
)
LANGUAGE plpgsql
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
            p.view_count,
            -- Calculate sales count
            (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) as sales_count,
            -- Calculate wishlist count
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
        -- Weighted score: Sales (50%), Wishlists (30%), Views (20%)
        (ps.sales_count * 0.5) + (ps.wishlist_count * 0.3) + (COALESCE(ps.view_count, 0) * 0.2) DESC,
        ps.created_at DESC
    LIMIT p_limit;
END;
$$;
