-- This script corrects and defines all database functions for the admin dashboard.

-- 1. Create a custom type for roles if it doesn't exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('customer', 'manager', 'admin', 'super-admin');
    END IF;
END
$$;

-- 2. Add 'role' column to profiles if it doesn't exist.
DO $$
BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role app_role DEFAULT 'customer';
EXCEPTION
    WHEN duplicate_column THEN
        RAISE NOTICE 'column role already exists in profiles.';
END
$$;

-- 3. Create a helper function to safely check the current user's role.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY INVOKER -- Important: runs as the user making the query
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- 4. Set up correct Row Level Security (RLS) on the profiles table.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile." ON profiles;
CREATE POLICY "Users can view their own profile." ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can view all profiles." ON profiles;
CREATE POLICY "Admins can view all profiles." ON profiles FOR SELECT USING (get_my_role() IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Users can update their own profile." ON profiles;
CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Super-admins can update any profile." ON profiles;
CREATE POLICY "Super-admins can update any profile." ON profiles FOR UPDATE USING (get_my_role() = 'super-admin');


-- 5. Create a secure VIEW on auth.users to expose non-sensitive data.
CREATE OR REPLACE VIEW public.user_details AS
    SELECT id, email, created_at
    FROM auth.users;
GRANT SELECT ON public.user_details TO authenticated;


-- 6. Create RPC functions. Drop old ones first to ensure a clean state.
DROP FUNCTION IF EXISTS get_all_users();
DROP FUNCTION IF EXISTS get_admin_reviews();
DROP FUNCTION IF EXISTS get_admin_refunds();

-- Function for the User Management page.
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    role TEXT -- Use TEXT for robustness
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        p.id,
        p.full_name,
        u.email,
        p.avatar_url,
        u.created_at,
        p.role::text -- Explicitly cast role to text
    FROM public.profiles p
    JOIN public.user_details u ON p.id = u.id
    ORDER BY u.created_at DESC;
$$;

-- Function for the Reviews page and Dashboard.
CREATE OR REPLACE FUNCTION get_admin_reviews()
RETURNS TABLE (
    id BIGINT,
    rating INT,
    text TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    author JSONB,
    product JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.rating,
        r.text,
        r.status,
        r.created_at,
        jsonb_build_object(
            'name', p.full_name,
            'avatar_url', p.avatar_url
        ) AS author,
        jsonb_build_object(
            'id', pr.id,
            'name', pr.name,
            'featured_image_url', pr.featured_image_url
        ) AS product
    FROM public.reviews r
    JOIN public.profiles p ON r.user_id = p.id
    JOIN public.products pr ON r.product_id = pr.id
    ORDER BY r.created_at DESC;
END;
$$;

-- Function for the Refunds page and Dashboard.
CREATE OR REPLACE FUNCTION get_admin_refunds()
RETURNS TABLE (
    id BIGINT,
    order_id BIGINT,
    order_number TEXT,
    amount NUMERIC,
    status TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ,
    user_id UUID,
    customer_name TEXT,
    customer_avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.order_id,
        o.order_number,
        r.amount,
        r.status::text,
        r.reason,
        r.created_at,
        r.user_id,
        p.full_name as customer_name,
        p.avatar_url as customer_avatar_url
    FROM public.refunds r
    JOIN public.orders o ON r.order_id = o.id
    JOIN public.profiles p ON r.user_id = p.id
    ORDER BY r.created_at DESC;
END;
$$;