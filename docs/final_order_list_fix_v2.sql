-- This script fixes the "structure of query does not match function result type" error
-- by first dropping the old, incorrect function before creating the new version.

DROP FUNCTION IF EXISTS public.get_admin_order_list();

CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount numeric,
    status public.order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
LANGUAGE 'sql'
SECURITY DEFINER
AS $$
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
    public.orders o
  LEFT JOIN
    public.profiles p ON o.user_id = p.id
  LEFT JOIN
    auth.users u on o.user_id = u.id
  ORDER BY
    o.created_at DESC;
$$;

-- Additionally, let's ensure the relationship exists to prevent other errors.
-- This part will only run if the constraint doesn't already exist.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'orders_user_id_fkey'
        AND conrelid = 'public.orders'::regclass
    ) THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT orders_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES auth.users (id) ON DELETE SET NULL;
    END IF;
END;
$$;
