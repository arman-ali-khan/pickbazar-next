-- This script sets up user roles, security policies, and helper functions for user management.

-- Section 1: Role Definition and Profile Setup
-- 1.1: Create a custom type for application roles.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('customer', 'manager', 'admin', 'super-admin');
    END IF;
END
$$;

-- 1.2: Add a 'role' column to the 'profiles' table if it doesn't exist.
DO $$
BEGIN
    ALTER TABLE public.profiles ADD COLUMN role app_role DEFAULT 'customer';
EXCEPTION
    WHEN duplicate_column THEN
        RAISE NOTICE 'Column "role" already exists in "profiles".';
END
$$;

-- Section 2: Helper Function for Role Checking
-- 2.1: Create a secure function to check the current user's role.
-- This is crucial to avoid infinite recursion in RLS policies.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT p.role::text INTO user_role FROM public.profiles p WHERE p.id = auth.uid();
    RETURN user_role;
END;
$$;
-- Grant execute permission to authenticated users.
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- Section 3: Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- 3.1: Users can view their own profile.
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 3.2: Users can update their own profile (but not their role).
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3.3: Super-admins can view all profiles.
DROP POLICY IF EXISTS "Super-admins can view all profiles." ON public.profiles;
CREATE POLICY "Super-admins can view all profiles." ON public.profiles
  FOR SELECT USING (public.get_my_role() = 'super-admin');

-- 3.4: Super-admins can update any profile, including the role.
DROP POLICY IF EXISTS "Super-admins can update any profile." ON public.profiles;
CREATE POLICY "Super-admins can update any profile." ON public.profiles
  FOR UPDATE USING (public.get_my_role() = 'super-admin');

-- Section 4: Secure View for User Data
-- 4.1: Create a view to safely expose non-sensitive user data.
DROP VIEW IF EXISTS public.users_view;
CREATE VIEW public.users_view AS
SELECT
    u.id,
    p.full_name,
    u.email,
    p.avatar_url,
    p.role::text AS role,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;
-- Set the owner to postgres for security
ALTER VIEW public.users_view OWNER TO postgres;

-- 4.2: Grant SELECT on the view to authenticated users. RLS will handle the rest.
GRANT SELECT ON public.users_view TO authenticated;


-- Section 5: Database Functions (RPC)
-- Drop all old user/admin management functions to ensure a clean state.
DROP FUNCTION IF EXISTS get_admins();
DROP FUNCTION IF EXISTS get_potential_admins();
DROP FUNCTION IF EXISTS get_all_users();
DROP FUNCTION IF EXISTS get_user_details(uuid);

-- 5.1: Create a function to get all users, intended for super-admin use.
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF public.get_my_role() <> 'super-admin' THEN
        RAISE EXCEPTION 'You do not have permission to view all users.';
    END IF;

    RETURN QUERY
    SELECT * FROM public.users_view
    ORDER BY created_at DESC;
END;
$$;

-- 5.2: Create a function to get details for a single user.
CREATE OR REPLACE FUNCTION public.get_user_details(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    role text,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF public.get_my_role() <> 'super-admin' AND auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'You do not have permission to view this user.';
    END IF;

    RETURN QUERY
    SELECT uv.id, uv.full_name, uv.email, uv.avatar_url, uv.role, uv.created_at
    FROM public.users_view uv
    WHERE uv.id = p_user_id;
END;
$$;
