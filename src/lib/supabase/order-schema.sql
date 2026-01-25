-- This script is designed to be idempotent and safe to run multiple times.

-- Section 1: Profiles Table Configuration
-- Creates the profiles table if it doesn't exist and ensures it has a 'role' column.

create table if not exists public.profiles (
  id uuid not null references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  contact_number text,
  primary key (id)
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.columns
        WHERE  table_name = 'profiles'
        AND    column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'customer';
    END IF;
END;
$$;

-- Set up Row Level Security (RLS) for the profiles table
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);


-- Section 2: Helper Function to Get User Role
-- This function securely retrieves a user's role from the profiles table.
create or replace function get_user_role(p_user_id uuid)
returns text
language plpgsql
security definer
as $$
begin
  return (
    select role from public.profiles where id = p_user_id limit 1
  );
end;
$$;


-- Section 3: Orders and Order Items Table Security
-- This section enables RLS and creates policies for admins and users.

-- Enable RLS on orders and order_items tables
alter table public.orders enable row level security;
alter table public.order_items enable row level security;


-- RLS Policies for 'orders' table
-- Policy for Admins: Allows users with specified admin roles to view all orders.
drop policy if exists "Allow admin read access" on public.orders;
create policy "Allow admin read access"
on public.orders for select
using (get_user_role(auth.uid()) IN ('Admin', 'Manager', 'Super Admin'));

-- Policy for Users: Allows individual users to view their own orders.
drop policy if exists "Allow individual user read access" on public.orders;
create policy "Allow individual user read access"
on public.orders for select
using (auth.uid() = user_id);


-- RLS Policies for 'order_items' table
-- Policy for Admins: Allows admin users to view all order items.
drop policy if exists "Allow admin read access on order items" on public.order_items;
create policy "Allow admin read access on order items"
on public.order_items for select
using (get_user_role(auth.uid()) IN ('Admin', 'Manager', 'Super Admin'));

-- Policy for Users: Allows individual users to view items from their own orders.
drop policy if exists "Allow individual user read access on order items" on public.order_items;
create policy "Allow individual user read access on order items"
on public.order_items for select
using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id and orders.user_id = auth.uid()
  )
);
