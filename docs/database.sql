-- ----------------------------------------------------------------
-- DATABASE MIGRATION: ROBUST PRODUCT RECOMMENDATION ALGORITHMS
--
-- This script replaces the previous, faulty recommendation functions
-- with new, resilient versions that include fallback logic.
-- You can run this script safely in your Supabase SQL Editor.
-- ----------------------------------------------------------------

-- Drop the old, problematic functions if they exist
DROP FUNCTION IF EXISTS public.get_related_products(integer, integer);
DROP FUNCTION IF EXISTS public.get_recommended_products(integer);

-- Re-create the function to get related products
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
    WITH
    -- 1. Find source product's categories and tags
    source_cats AS (SELECT category_id FROM product_categories WHERE product_id = p_id),
    source_tags AS (SELECT tag_id FROM product_tags WHERE product_id = p_id),

    -- 2. Score all other products based on shared attributes
    scored_products AS (
        SELECT
            p.id,
            p.created_at,
            p.view_count,
            -- Relevance score calculation
            (
                (SELECT COUNT(*) FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id IN (SELECT category_id FROM source_cats)) * 2
                +
                (SELECT COUNT(*) FROM product_tags pt WHERE pt.product_id = p.id AND pt.tag_id IN (SELECT tag_id FROM source_tags))
            ) AS score
        FROM products p
        WHERE p.id != p_id AND p.status = 'active'
    )
    -- 3. Select and order by score, then by views, then by creation date
    SELECT
        p.id,
        p.name,
        p.price,
        p.original_price,
        p.featured_image_url,
        p.unit
    FROM scored_products s
    JOIN products p ON s.id = p.id
    ORDER BY s.score DESC, s.view_count DESC NULLS LAST, s.created_at DESC
    LIMIT p_limit;
END;
$$;


-- Re-create the function to get recommended products
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
            p.created_at,
            -- Calculate sales count
            (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) as sales_count,
            -- Calculate wishlist count
            (SELECT COUNT(*) FROM wishlist w WHERE w.product_id = p.id) as wishlist_count,
            -- Use view_count
            p.view_count
        FROM
            products p
        WHERE p.status = 'active'
    )
    SELECT
        p.id,
        p.name,
        p.price,
        p.original_price,
        p.featured_image_url,
        p.unit
    FROM product_scores ps
    JOIN products p ON ps.id = p.id
    ORDER BY
        -- Weighted score: Sales (50%), Wishlists (30%), Views (20%)
        (ps.sales_count * 0.5) + (ps.wishlist_count * 0.3) + (COALESCE(ps.view_count, 0) * 0.2) DESC,
        ps.created_at DESC
    LIMIT p_limit;
END;
$$;
