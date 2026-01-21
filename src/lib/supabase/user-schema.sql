-- Function to get all users with their profile information
-- This function is a SECURITY DEFINER, meaning it runs with the privileges of the user who defined it (the postgres role).
-- This is necessary to bypass Row Level Security on the auth.users table.
-- WARNING: Be very careful with security definer functions.
-- We've added a check to ensure only authenticated users can call it.
-- For production, you should add a role check to ensure only admins can call this.
create or replace function get_all_users()
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Ensure the user is authenticated before running the query
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
    select
      u.id,
      p.full_name,
      p.avatar_url,
      u.email,
      u.created_at
    from auth.users u
    left join public.profiles p on u.id = p.id
    order by u.created_at desc;
end;
$$;
