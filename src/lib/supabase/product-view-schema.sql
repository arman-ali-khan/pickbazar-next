-- Add view_count to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- Function to increment product view count
CREATE OR REPLACE FUNCTION increment_product_view(product_id_to_inc INT)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET view_count = view_count + 1
    WHERE id = product_id_to_inc;
END;
$$ LANGUAGE plpgsql;

-- Function to get related products
DROP FUNCTION IF EXISTS get_related_products(p_id int4, p_limit int4);
CREATE OR REPLACE FUNCTION get_related_products(p_id integer, p_limit integer)
 RETURNS TABLE(id integer, name text, price real, original_price real, featured_image_url text, unit text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH product_cats AS (
        SELECT category_id FROM product_categories WHERE product_id = p_id
    )
    SELECT
        p.id,
        p.name,
        p.price,
        p.original_price,
        p.featured_image_url,
        p.unit
    FROM products p
    JOIN product_categories pc ON p.id = pc.product_id
    WHERE pc.category_id IN (SELECT category_id FROM product_cats)
      AND p.id != p_id
      AND p.status = 'active'
    GROUP BY p.id
    ORDER BY COUNT(p.id) DESC, p.view_count DESC
    LIMIT p_limit;
END;
$function$
;
