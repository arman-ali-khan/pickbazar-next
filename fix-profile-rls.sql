-- This script definitively fixes the Row-Level Security (RLS) policies for the 'profiles' table.
-- It is safe to run this script multiple times.

-- 1. Temporarily disable RLS to ensure we can drop all policies without dependency issues.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop all potential old, conflicting, or incorrect policies on the profiles table.
-- This is the most crucial step to ensure a clean state.
DROP POLICY IF EXISTS "Enable all access for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "manage_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are publicly visible." ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- 3. Create the two simple, correct policies from scratch.

-- POLICY A: Allow public, anonymous read access to all profiles.
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING (true);

-- POLICY B: Allow authenticated users to insert, update, and delete their own profile.
-- This single policy correctly handles the `upsert` operation.
-- The `USING` clause applies to SELECT, UPDATE, DELETE.
-- The `WITH CHECK` clause applies to INSERT, UPDATE.
CREATE POLICY "Users can manage their own profile."
ON public.profiles FOR ALL
TO authenticated
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- 4. Re-enable Row Level Security on the table.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
