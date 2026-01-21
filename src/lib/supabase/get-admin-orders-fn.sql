-- Drop function if it exists to ensure a clean update
DROP FUNCTION IF EXISTS public.get_admin_orders();

-- Create the function to get all orders for admin view
CREATE OR REPLACE FUNCTION public.get_admin_orders()
RETURNS TABLE (
  id bigint,
  order_number text,
  created_at timestamptz,
  total_amount numeric,
  status public.order_status,
  shipping_details jsonb,
  customer_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: Runs with the permissions of the function owner
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Get the role of the currently authenticated user from the profiles table
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  -- Security check: only allow users with specific roles to execute this
  IF caller_role IN ('admin', 'manager', 'super-admin') THEN
    RETURN QUERY
    SELECT
      o.id,
      o.order_number,
      o.created_at,
      o.total_amount,
      o.status,
      o.shipping_details,
      p.avatar_url AS customer_avatar_url
    FROM
      public.orders AS o
    LEFT JOIN
      public.profiles AS p ON o.user_id = p.id
    ORDER BY
      o.created_at DESC;
  ELSE
    -- If the user is not an admin, raise an exception
    RAISE EXCEPTION 'Permission denied: You must be an administrator to view all orders.';
  END IF;
END;
$$;

-- Grant execution permission to authenticated users
-- The function's internal logic will handle role-based access control
GRANT EXECUTE ON FUNCTION public.get_admin_orders() TO authenticated;
