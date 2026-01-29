
-- This script fixes the "structure of query does not match function result type" error on the order details page.
-- It ensures the function returns data in the exact format the application expects.

-- Drop the old, potentially incorrect function to avoid conflicts.
DROP FUNCTION IF EXISTS get_admin_order_details(p_order_number TEXT);

-- Recreate the function with the correct return columns and types.
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount numeric,
    status order_status,
    shipping_details jsonb,
    user_id uuid,
    customer_name text,
    customer_avatar_url text,
    order_items jsonb,
    coupon_code text,
    discount_amount numeric,
    payment_method text,
    transaction_details jsonb
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
    o.user_id,
    p.full_name,
    p.avatar_url,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'quantity', oi.quantity,
          'price_at_purchase', oi.price,
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
  FROM
    orders o
  LEFT JOIN
    profiles p ON o.user_id = p.id
  WHERE
    o.order_number = p_order_number;
END;
$$;

    