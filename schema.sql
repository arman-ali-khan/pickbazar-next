-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  bio text,
  contact_number text,
  updated_at timestamptz default now()
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security
alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up.
-- See https://supabase.com/docs/guides/auth/managing-user-data#creating-a-profile-for-the-user
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a table for user addresses
create table addresses (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  address_type text not null, -- 'billing' or 'shipping'
  title text,
  street_address text,
  city text,
  state text,
  zip text,
  country text,
  created_at timestamptz default now()
);

-- RLS for addresses
alter table addresses
  enable row level security;

create policy "Users can view their own addresses." on addresses
  for select using (auth.uid() = user_id);

create policy "Users can insert their own addresses." on addresses
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own addresses." on addresses
  for update using (auth.uid() = user_id);

create policy "Users can delete their own addresses." on addresses
  for delete using (auth.uid() = user_id);

-- Set up Storage for Avatars
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

-- Set up access policies for storage.
-- See https://supabase.com/docs/guides/storage/security/access-control#creating-policies
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "Anyone can upload an avatar." on storage.objects;
create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');

drop policy if exists "Anyone can update their own avatar." on storage.objects;
create policy "Anyone can update their own avatar." on storage.objects
  for update using (auth.uid() = owner) with check (bucket_id = 'avatars');

-- Create other tables as needed...
