-- This script provides a comprehensive fix for the persistent database errors.
-- It corrects column data types and rebuilds the necessary functions to match the application code.
-- It is safe to run multiple times.

DO $$
BEGIN
    -- Step 1: Safely alter the 'orders' table column type if it is incorrect.
    -- This fixes the "operator does not exist: text > unknown" error.
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orders'
          AND column_name = 'created_at'
          AND (data_type = 'text' OR udt_name = 'text')
    ) THEN
        ALTER TABLE public.orders
        ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::timestamptz;
        RAISE NOTICE 'Altered public.orders.created_at to timestamptz.';
    ELSE
        RAISE NOTICE 'public.orders.created_at is already the correct type or does not exist.';
    END IF;

    -- Step 2: Safely alter the 'profiles' table column type if it is incorrect.
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'created_at'
          AND (data_type = 'text' OR udt_name = 'text')
    ) THEN
        ALTER TABLE public.profiles
        ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::timestamptz;
        RAISE NOTICE 'Altered public.profiles.created_at to timestamptz.';
    ELSE
        RAISE NOTICE 'public.profiles.created_at is already the correct type or does not exist.';
    END IF;

    -- Step 3: Drop potentially conflicting or old versions of the function.
    DROP FUNCTION IF EXISTS public.get_admin_order_list();

    -- Step 4: Re-create the function with the correct return structure.
    -- This fixes the "structure of query does not match function result type" error
    -- by ensuring the function's output matches what the frontend code expects.
    CREATE OR REPLACE FUNCTION public.get_admin_order_list()
    RETURNS TABLE(
        id bigint,
        order_number text,
        created_at text, -- The app code expects a string here, so we cast it back
        total_amount double precision,
        status public.order_status,
        customer_name text,
        customer_email text,
        customer_avatar_url text
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
        RETURN QUERY
        SELECT
            o.id,
            o.order_number,
            o.created_at::text, -- Cast timestamptz to text for the function's return signature
            o.total_amount,
            o.status,
            p.full_name AS customer_name,
            u.email AS customer_email,
            p.avatar_url AS customer_avatar_url
        FROM
            orders o
        LEFT JOIN
            auth.users u ON o.user_id = u.id
        LEFT JOIN
            profiles p ON o.user_id = p.id
        ORDER BY
            o.created_at DESC; -- This now sorts correctly on the timestamp column
    END;
    $$;

    -- Step 5: Ensure the correct permissions are set.
    GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO service_role;


    RAISE NOTICE 'Successfully created get_admin_order_list() function and applied permissions.';

END $$;
