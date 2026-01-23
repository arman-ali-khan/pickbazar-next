-- Drop existing policy and function to ensure a clean state
DROP POLICY IF EXISTS "Allow admin full access on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow public read access on settings" ON public.settings;
DROP FUNCTION IF EXISTS is_admin(uuid);

-- Helper function to check if a user is an admin, manager, or super-admin.
-- SECURITY DEFINER allows it to read the profiles table regardless of the calling user's RLS.
-- STABLE helps the query planner avoid potential recursion errors.
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role::text INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role IN ('admin', 'manager', 'super-admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Re-enable Row Level Security on the table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read-only access
CREATE POLICY "Allow public read access on settings" ON public.settings
    FOR SELECT USING (true);

-- Policy: Allow admin-level users to do everything else (insert, update, delete)
CREATE POLICY "Allow admin full access on settings" ON public.settings
    FOR ALL
    USING ( is_admin(auth.uid()) )
    WITH CHECK ( is_admin(auth.uid()) );
