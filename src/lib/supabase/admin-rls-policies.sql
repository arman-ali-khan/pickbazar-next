-- This is safe to run multiple times.

-- Enable RLS for profiles if not already enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow admin users to read all profiles.
DROP POLICY IF EXISTS "Allow admin read access on profiles" ON public.profiles;
CREATE POLICY "Allow admin read access on profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    (get_user_role(auth.uid()) = 'admin') OR
    (get_user_role(auth.uid()) = 'manager') OR
    (get_user_role(auth.uid()) = 'super-admin')
  );

-- Ensure non-admin users can still read their own profile.
-- This might exist already, but dropping and recreating is safe.
DROP POLICY IF EXISTS "Allow individual read access on profiles" ON public.profiles;
CREATE POLICY "Allow individual read access on profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Ensure users can update their own profile.
-- This is good practice to include.
DROP POLICY IF EXISTS "Allow individual update access on profiles" ON public.profiles;
CREATE POLICY "Allow individual update access on profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);