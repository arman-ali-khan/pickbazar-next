-- This script definitively fixes the admin order list page by recreating the database function
-- with the correct column names, aliases, and data types.

-- Drop the old, broken function to ensure a clean state.
DROP FUNCTION IF EXISTS public.get_admin_order_list();

-- Create the new function with explicit column aliases that exactly match the `RETURNS TABLE` definition.
CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status text,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
      o.id,
      o.order_number,
      o.created_at,
      o.total_amount,
      o.status::text,
      p.full_name AS customer_name,
      u.email AS customer_email,
      p.avatar_url AS customer_avatar_url
  FROM
      public.orders AS o
  LEFT JOIN
      public.profiles AS p ON o.user_id = p.id
  LEFT JOIN
      auth.users AS u ON o.user_id = u.id
  ORDER BY
      o.created_at DESC;
$$;

-- Grant permissions for authenticated users (admins) to call this function.
GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO authenticated;
