-- Drop all old, potentially conflicting policies on the profiles table to ensure a clean state.
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Enable all access for users based on user_id" ON public.profiles;

-- Create a single, comprehensive policy for all actions.
-- This policy allows a user to perform any action (SELECT, INSERT, UPDATE, DELETE)
-- on a row in the 'profiles' table if and only if the 'id' of that row
-- matches their own authenticated user ID. This is a secure and standard pattern for upserts.
CREATE POLICY "Enable all access for users based on user_id"
ON public.profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled on the table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
