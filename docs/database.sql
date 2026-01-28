--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do update set
    full_name = coalesce(new.raw_user_meta_data->>'full_name', profiles.full_name),
    avatar_url = coalesce(new.raw_user_meta_data->>'avatar_url', profiles.avatar_url);
  return new;
end;
$$;