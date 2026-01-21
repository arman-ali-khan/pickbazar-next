-- Drop the function if it exists to allow for changing the return type
DROP FUNCTION IF EXISTS public.get_all_users();

CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id uuid, full_name text, email text, avatar_url text, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    u.id,
    COALESCE(p.full_name, u.raw_user_meta_data->>'full_name') AS full_name,
    u.email,
    COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url') AS avatar_url,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id;
$$;
