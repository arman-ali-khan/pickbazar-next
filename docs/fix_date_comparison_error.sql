-- Fix for 'operator does not exist: text > unknown' error.
-- This error is typically caused by trying to compare a date/time column
-- that is incorrectly stored as text. This script will check the `created_at`
-- columns on the `orders` and `profiles` tables and convert them to the
-- proper `TIMESTAMPTZ` type if they are text.

DO $$
BEGIN
    -- Check if orders.created_at is not a timestamp and attempt to fix it
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orders'
          AND column_name = 'created_at'
          AND udt_name != 'timestamptz'
    ) THEN
        RAISE NOTICE 'orders.created_at is not a timestamptz. Attempting conversion...';
        -- Add temp column
        ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at_new TIMESTAMPTZ;
        -- Copy and cast data
        UPDATE public.orders SET created_at_new = created_at::TIMESTAMPTZ;
        -- Drop old column
        ALTER TABLE public.orders DROP COLUMN created_at;
        -- Rename new column
        ALTER TABLE public.orders RENAME COLUMN created_at_new TO created_at;
        RAISE NOTICE 'orders.created_at has been converted to timestamptz.';
    END IF;

    -- Check if profiles.created_at is not a timestamp and attempt to fix it
    -- Note: This is a safeguard; this column is usually managed by Supabase Auth triggers.
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'created_at'
          AND udt_name != 'timestamptz'
    ) THEN
        RAISE NOTICE 'profiles.created_at is not a timestamptz. Attempting conversion...';
        -- Add temp column
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at_new TIMESTAMPTZ;
        -- Copy and cast data
        UPDATE public.profiles SET created_at_new = created_at::TIMESTAMPTZ;
        -- Drop old column
        ALTER TABLE public.profiles DROP COLUMN created_at;
        -- Rename new column
        ALTER TABLE public.profiles RENAME COLUMN created_at_new TO created_at;
        RAISE NOTICE 'profiles.created_at has been converted to timestamptz.';
    END IF;
END;
$$;
