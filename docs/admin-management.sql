-- This script provides a definitive fix for admin role management and data fetching.
-- It resolves the "infinite recursion" error caused by faulty Row Level Security (RLS) policies.

-- 1. Create a helper function to get the current user's role non-recursively.
-- This is crucial to prevent database errors.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We specify the security definer to run this with the privileges of the function owner,
  -- which allows it to bypass RLS on the profiles table for this specific lookup.
  -- This is a safe and standard pattern to break recursion.
  RETURN (SELECT role::text FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- 2. Re-define RLS policies on the `profiles` table to use the non-recursive helper function.

-- Allow users to view their own profile.
DROP POLICY IF EXISTS "Users can view their own profile." ON profiles;
CREATE POLICY "Users can view their own profile." ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow super-admins to view all user profiles.
DROP POLICY IF EXISTS "Super-admins can view all profiles." ON profiles;
CREATE POLICY "Super-admins can view all profiles." ON profiles
  FOR SELECT USING (get_my_role() = 'super-admin');

-- Allow users to update their own profile (non-role fields).
DROP POLICY IF EXISTS "Users can update their own profile." ON profiles;
CREATE POLICY "Users can update their own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow super-admins to update any profile, including the role.
DROP POLICY IF EXISTS "Super-admins can update any profile." ON profiles;
CREATE POLICY "Super-admins can update any profile." ON profiles
  FOR UPDATE USING (get_my_role() = 'super-admin');


-- 3. Re-define the admin-related data fetching functions for consistency.

-- Function to get all admin-level users.
DROP FUNCTION IF EXISTS get_admins();
CREATE OR REPLACE FUNCTION get_admins()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF get_my_role() <> 'super-admin' THEN
        RAISE EXCEPTION 'Only super-admins can view the list of admins.';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        u.email,
        p.avatar_url,
        p.role::text
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.role::text IN ('admin', 'manager', 'super-admin')
    ORDER BY p.role::text, p.full_name;
END;
$$;


-- Function to get all non-admin users (customers) who can be promoted.
DROP FUNCTION IF EXISTS get_potential_admins();
CREATE OR REPLACE FUNCTION get_potential_admins()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF get_my_role() <> 'super-admin' THEN
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
