-- This function retrieves all users from the auth.users table,
-- combining data from the public.profiles table for a complete view.
-- It is defined to be "SECURITY DEFINER" to allow access to the auth.users table.
create or replace function get_all_users()
returns table (
    id text,
    full_name text,
    email text,
    avatar_url text,
    created_at text
) as $$
begin
    -- The return query must match the 'returns table' definition in order and type.
    -- We select the user's ID, email, and creation date from the auth table.
    -- We use COALESCE to get the full_name and avatar_url from the public.profiles table first,
    -- and if they are not present, we fall back to the raw_user_meta_data in the auth.users table.
    -- This ensures we get the most up-to-date information and prevents errors if the profiles table is out of sync.
    return query
    select
        u.id::text,
        coalesce(p.full_name, u.raw_user_meta_data->>'full_name') as full_name,
        u.email,
        coalesce(p.avatar_url, u.raw_user_meta_data->>'avatar_url') as avatar_url,
        u.created_at::text as created_at
    from auth.users as u
    left join public.profiles as p on u.id = p.id;
end;
$$ language plpgsql security definer;

-- Grant execute permission to the 'service_role' so it can be called via the API
grant execute on function public.get_all_users() to service_role;
