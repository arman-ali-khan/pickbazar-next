-- This script fixes the "duplicate key" error during user registration.
-- It ensures that when a new user signs up in Supabase Auth, a corresponding
-- profile is created safely in the public.profiles table.

-- 1. Define the database function that will be triggered on new user creation.
-- "CREATE OR REPLACE" ensures that this function replaces any old, buggy versions.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert a new profile record for the new user, using the ID and metadata from the auth entry.
  -- "ON CONFLICT (id) DO NOTHING" is the key to the fix. It tells PostgreSQL to simply
  -- do nothing if a profile with that user ID already exists. This gracefully
  -- handles the race condition and prevents the "duplicate key" error.
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'customer' -- Default all new users to the 'customer' role.
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Define the trigger that executes the function.
-- "DROP TRIGGER IF EXISTS" makes this script safe to run multiple times.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Log completion for the user.
SELECT 'User profile trigger has been successfully fixed.';
