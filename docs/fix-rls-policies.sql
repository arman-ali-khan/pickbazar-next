-- This script fixes an infinite recursion error in the database's Row Level Security (RLS) policies.
-- It creates a helper function to securely get the current user's role and updates the policies to use it.

-- Drop the problematic policies first to ensure a clean slate
DROP POLICY IF EXISTS "Super-admins can view all profiles." ON profiles;
DROP POLICY IF EXISTS "Admins have full access on refunds" ON refunds;
DROP POLICY IF EXISTS "Super-admins can update any profile." ON profiles;
DROP POLICY IF EXISTS "Admins can manage pages" ON pages;


-- 1. Create a helper function to get the current user's role securely.
-- This function avoids recursive policy checks on the 'profiles' table.
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$;


-- 2. Re-create policies using the new helper function.

-- Policy for viewing all profiles (for super-admins)
CREATE POLICY "Super-admins can view all profiles." ON profiles
  FOR SELECT USING (get_current_user_role() = 'super-admin');

-- Policy for updating any profile (for super-admins)
CREATE POLICY "Super-admins can update any profile." ON profiles
  FOR UPDATE USING (get_current_user_role() = 'super-admin');

-- Policy for refunds management (for admins, managers, and super-admins)
CREATE POLICY "Admins have full access on refunds" ON refunds
FOR ALL USING (
  get_current_user_role() IN ('admin', 'manager', 'super-admin')
);

-- Policy for page management (for admins, managers, and super-admins)
CREATE POLICY "Admins can manage pages" ON pages
FOR ALL USING (
  get_current_user_role() IN ('admin', 'manager', 'super-admin')
);

-- Note: Policies for users viewing/managing their own data (like "Users can view their own profile.")
-- do not cause recursion and are left as they are. They are safe.
