-- Drop existing policies and functions to ensure a clean slate.
DROP POLICY IF EXISTS "Allow admins to manage settings" ON public.settings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.settings;
DROP FUNCTION IF EXISTS is_admin(uuid);

-- 1. Create a secure helper function to check for admin-level roles.
-- The 'SECURITY DEFINER' clause is crucial as it allows the function to
-- check the 'profiles' table with elevated privileges, resolving permission errors.
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Safely get the role from the 'profiles' table for the currently authenticated user.
  SELECT role::text INTO user_role FROM public.profiles WHERE id = user_id;
  
  -- Return true if the user's role is one of the administrative roles.
  RETURN user_role IN ('admin', 'manager', 'super-admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Create the settings table if it doesn't exist.
-- This ensures the script is safe to run even on a fresh setup.
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB
);

-- 3. Enable Row Level Security on the settings table.
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;


-- 4. Create a single, comprehensive policy for all admin actions.
-- This policy uses the new is_admin() helper function to grant access
-- for all operations (SELECT, INSERT, UPDATE, DELETE).
CREATE POLICY "Allow admins to manage settings" ON public.settings
    FOR ALL -- This applies to SELECT, INSERT, UPDATE, and DELETE
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
