-- Step 1: Drop the existing function to avoid any signature conflicts.
DROP FUNCTION IF EXISTS public.get_admin_order_list();

-- Step 2: Ensure the 'created_at' column in the 'orders' table is of the correct type.
-- This is the root cause of the 'operator does not exist: text > unknown' error.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orders'
          AND column_name = 'created_at'
          AND (data_type = 'text' OR udt_name = 'text')
    ) THEN
        -- Safely alter the column type to timestamp with time zone
        ALTER TABLE public.orders
        ALTER COLUMN created_at TYPE timestamp with time zone
        USING created_at::timestamptz;
    END IF;
END $$;

-- Step 3: Re-create the function with the correct return signature.
-- The 'created_at' column is now guaranteed to be a timestamp, so this function will work correctly.
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
AS $$
BEGIN
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
        public.orders o
    LEFT JOIN
        auth.users u ON o.user_id = u.id
    LEFT JOIN
        public.profiles p ON u.id = p.id
    ORDER BY
        o.created_at DESC;
END;
$$;
