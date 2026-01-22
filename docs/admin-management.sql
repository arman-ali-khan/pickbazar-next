-- 1. Create a custom type for roles for better data integrity
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('customer', 'manager', 'admin', 'super-admin');
    END IF;
END
$$;

-- 2. Ensure the profiles table has the role column, default to 'customer'
-- This command is safe to re-run. It adds the column if it's missing.
DO $$
BEGIN
    ALTER TABLE profiles ADD COLUMN role app_role DEFAULT 'customer';
EXCEPTION
    WHEN duplicate_column THEN
        -- If the column exists but has the wrong type, you may need to handle it manually
        -- For this script, we assume if it exists, it's acceptable or already correct.
        RAISE NOTICE 'column role already exists in profiles.';
END
$$;

-- 3. Add/Update Row Level Security policies for managing roles.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile.
DROP POLICY IF EXISTS "Users can view their own profile." ON profiles;
CREATE POLICY "Users can view their own profile." ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow super-admins to view all user profiles.
DROP POLICY IF EXISTS "Super-admins can view all profiles." ON profiles;
CREATE POLICY "Super-admins can view all profiles." ON profiles
  FOR SELECT USING ((SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) = 'super-admin');

-- Allow users to update their own profile (non-role fields).
DROP POLICY IF EXISTS "Users can update their own profile." ON profiles;
CREATE POLICY "Users can update their own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow super-admins to update any profile, including the role.
DROP POLICY IF EXISTS "Super-admins can update any profile." ON profiles;
CREATE POLICY "Super-admins can update any profile." ON profiles
  FOR UPDATE USING ((SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) = 'super-admin');


-- 4. Create RPC functions to get users based on roles.

-- Function to get all admin-level users
CREATE OR REPLACE FUNCTION get_admins()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    role app_role
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) != 'super-admin' THEN
        RAISE EXCEPTION 'Only super-admins can view the list of admins.';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        u.email,
        p.avatar_url,
        p.role
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.role IN ('admin', 'manager', 'super-admin')
    ORDER BY p.role, p.full_name;
END;
$$;


-- Function to get all non-admin users (customers)
CREATE OR REPLACE FUNCTION get_potential_admins()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) != 'super-admin' THEN
        RAISE EXCEPTION 'Only super-admins can promote users.';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        u.email,
        p.avatar_url
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.role = 'customer'
    ORDER BY p.full_name;
END;
$$;
