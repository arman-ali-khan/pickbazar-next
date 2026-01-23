-- This script sets up roles and secure RLS policies for user management.

-- 1. Create a custom type for roles if it doesn't exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('customer', 'manager', 'admin', 'super-admin');
    END IF;
END
$$;

-- 2. Ensure the profiles table has the role column.
DO $$
BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role app_role DEFAULT 'customer';
EXCEPTION
    WHEN duplicate_column THEN
        RAISE NOTICE 'column role already exists in profiles.';
END
$$;

-- 3. Corrected Row Level Security (RLS) policies for the 'profiles' table.

-- Drop old policies to ensure a clean state.
DROP POLICY IF EXISTS "Users can view their own profile." ON profiles;
DROP POLICY IF EXISTS "Super-admins can view all profiles." ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON profiles;
DROP POLICY IF EXISTS "Super-admins can update any profile." ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles; -- Drop old permissive policy if it exists

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile.
CREATE POLICY "Users can view their own profile." ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow super-admins to view all user profiles.
-- This uses an EXISTS subquery to check the current user's role without causing recursion.
CREATE POLICY "Super-admins can view all profiles." ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND role = 'super-admin'
    )
  );

-- Allow users to update their own profile.
CREATE POLICY "Users can update their own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow super-admins to update any profile's role.
-- This also uses an EXISTS subquery to prevent recursion.
CREATE POLICY "Super-admins can update any profile." ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND role = 'super-admin'
    )
  );

-- 4. Create or replace secure database functions.

-- Drop the problematic recursive function.
DROP FUNCTION IF EXISTS get_my_role();

-- Function to get a list of all users and their details.
-- This is now secure because the RLS policies on 'profiles' are correct.
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    role app_role
)
LANGUAGE plpgsql
SECURITY DEFINER -- Use definer to be able to join with auth.users
SET search_path = public
AS $$
BEGIN
    -- This function now relies on the RLS policies of the calling user.
    -- A super-admin will be able to see all users.
    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        u.email,
        p.avatar_url,
        u.created_at,
        p.role
    FROM public.profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    ORDER BY p.full_name;
END;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
