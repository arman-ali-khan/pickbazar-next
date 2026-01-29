-- This script fixes the "operator does not exist: text > unknown" error
-- on the admin orders page by ensuring the `created_at` column in the `orders` table
-- is of the correct timestamp type, and by correcting the function that reads from it.

-- Step 1: Safely alter the 'created_at' column in the 'orders' table to be a timestamp.
-- This will only run if the column exists and is not already a timestamp with time zone.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'created_at' AND data_type <> 'timestamp with time zone'
    ) THEN
        ALTER TABLE public.orders ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ;
    END IF;
END $$;


-- Step 2: Drop the old, potentially incorrect function to avoid conflicts.
DROP FUNCTION IF EXISTS get_admin_order_list();

-- Step 3: Re-create the function with the correct return types.
CREATE OR REPLACE FUNCTION get_admin_order_list()
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount double precision,
    status public.order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
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
        public.profiles p ON o.user_id = p.id
    LEFT JOIN
        auth.users u on o.user_id = u.id
    ORDER BY
        o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant execute permission on the new function to the authenticated role.
GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO authenticated;
