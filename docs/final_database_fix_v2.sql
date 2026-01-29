-- This script fixes previous errors by correcting data types and function definitions.

-- Step 1: Ensure the 'created_at' columns have the correct TIMESTAMP type.
-- This command safely alters the columns. If they are already the correct type, no harm is done.
ALTER TABLE public.orders ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ;
ALTER TABLE public.profiles ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ;

-- Step 2: Drop the old, incorrect function to avoid conflicts.
DROP FUNCTION IF EXISTS public.get_admin_order_list();

-- Step 3: Recreate the function correctly.
-- This version removes the BEGIN/END block which can cause issues in some SQL editors,
-- and ensures the return types are correct.
CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount double precision,
    status public.order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
  RETURN QUERY
  SELECT
      o.id,
      o.order_number,
      o.created_at,
      o.total_amount,
      o.status,
      p.full_name as customer_name,
      u.email as customer_email,
      p.avatar_url as customer_avatar_url
  FROM
      public.orders AS o
  LEFT JOIN
      public.profiles AS p ON o.user_id = p.id
  LEFT JOIN
      auth.users AS u ON o.user_id = u.id
  ORDER BY
      o.created_at DESC;
$$;

-- Step 4: Ensure the function has the necessary permissions to run.
GRANT SELECT ON auth.users TO postgres;
GRANT SELECT ON public.profiles TO postgres;
