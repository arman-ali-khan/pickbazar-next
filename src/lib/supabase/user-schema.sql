-- Drop the functions if they exist to allow for changes in return types
DROP FUNCTION IF EXISTS public.get_all_users();
DROP FUNCTION IF EXISTS public.get_user_details(uuid);

-- Function to get all users with their profile information
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    u.id,
    COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', u.email)::text AS full_name,
    u.email::text,
    COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url')::text AS avatar_url,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  ORDER BY u.created_at DESC;
$$;

-- Function to get a single user's details
CREATE OR REPLACE FUNCTION public.get_user_details(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    u.id,
    COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', u.email)::text AS full_name,
    u.email::text,
    COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url')::text AS avatar_url,
    u.created_at
  FROM auth.users AS u
  LEFT JOIN public.profiles AS p ON u.id = p.id
  WHERE u.id = p_user_id;
$$;
