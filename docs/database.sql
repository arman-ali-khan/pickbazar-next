-- ----------------------------------------------------------------
-- DATABASE MIGRATION: ADVANCED PRODUCT RECOMMENDATION ALGORITHMS
--
-- This script updates and adds functions for fetching related and
-- recommended products. You can run this script safely in your
-- Supabase SQL Editor.
-- ----------------------------------------------------------------

-- Function to get related products based on shared categories and tags
-- This function scores products based on shared categories (2 points) and tags (1 point).
-- It replaces the previous, simpler version.
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
$$ LANGUAGE plpgsql;


-- Function to get recommended products based on views, sales, and wishlist counts
-- This function calculates a weighted score for each product to determine recommendations.
CREATE OR REPLACE FUNCTION get_recommended_products(p_limit integer)
RETURNS TABLE(
    id integer,
    name text,
    price double precision,
    original_price double precision,
    featured_image_url text,
    unit text,
    view_count integer
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
        ps.unit,
        ps.view_count
    FROM
        product_scores ps
    ORDER BY
        -- Weighted score: Sales (50%), Wishlists (30%), Views (20%)
        (ps.sales_count * 0.5) + (ps.wishlist_count * 0.3) + (COALESCE(ps.view_count, 0) * 0.2) DESC,
        ps.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
