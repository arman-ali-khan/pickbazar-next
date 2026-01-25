-- This script adds an 'updated_at' column to the 'profiles' table and sets up a trigger to automatically update it.
-- It is designed to be safe to run multiple times.

-- Add the 'updated_at' column to the 'profiles' table if it doesn't already exist.
-- It will default to the current time for new rows.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create a function that returns a trigger to set the 'updated_at' column to the current time.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists to ensure a clean setup.
DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;

-- Create the trigger that will fire BEFORE every UPDATE on the 'profiles' table.
CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
