-- Drop existing policies and functions to ensure a clean slate
DROP POLICY IF EXISTS "Users can manage their own profile data" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop existing tables using CASCADE to handle dependencies
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.wishlist_items CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;
DROP TABLE IF EXISTS public.refunds CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- PROFILES
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    bio text,
    contact_number text,
    email text
);
-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Create a single policy for all profile operations
CREATE POLICY "Users can manage their own profile data"
ON public.profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Function to create a profile for a new user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  return new;
end;
$$;

-- Trigger to run the function when a new user signs up.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ADDRESSES
CREATE TABLE public.addresses (
    id serial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    address_type text NOT NULL,
    title text NOT NULL,
    country text,
    city text,
    state text,
    zip text,
    street_address text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PRODUCTS
CREATE TABLE public.products (
    id serial PRIMARY KEY,
    name text NOT NULL,
    description text,
    price numeric(10, 2) NOT NULL,
    image_url text,
    category text,
    stock integer DEFAULT 0
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT TO anon, authenticated USING (true);


-- ORDERS
CREATE TABLE public.orders (
    id serial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total numeric(10, 2) NOT NULL,
    status text NOT NULL DEFAULT 'Pending',
    shipping_address_id integer REFERENCES public.addresses(id),
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own orders" ON public.orders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.order_items (
    id serial PRIMARY KEY,
    order_id integer NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id integer NOT NULL REFERENCES public.products(id),
    quantity integer NOT NULL,
    price numeric(10, 2) NOT NULL
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (
    (SELECT user_id FROM public.orders WHERE id = order_id) = auth.uid()
);


-- CARDS
-- NOTE: Never store raw card details. This is for storing references from a payment provider like Stripe.
CREATE TABLE public.cards (
    id serial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last4 text NOT NULL,
    brand text NOT NULL,
    exp_month integer NOT NULL,
    exp_year integer NOT NULL,
    stripe_card_id text -- Example for Stripe
);
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own cards" ON public.cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- WISHLIST
CREATE TABLE public.wishlist (
    id serial PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


CREATE TABLE public.wishlist_items (
    id serial PRIMARY KEY,
    wishlist_id integer NOT NULL REFERENCES public.wishlist(id) ON DELETE CASCADE,
    product_id integer NOT NULL REFERENCES public.products(id),
    UNIQUE(wishlist_id, product_id)
);
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own wishlist items" ON public.wishlist_items FOR ALL USING (
    (SELECT user_id FROM public.wishlist WHERE id = wishlist_id) = auth.uid()
) WITH CHECK (
    (SELECT user_id FROM public.wishlist WHERE id = wishlist_id) = auth.uid()
);


-- REVIEWS & QUESTIONS
CREATE TABLE public.reviews (
    id serial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id integer NOT NULL REFERENCES public.products(id),
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "All users can view reviews" ON public.reviews FOR SELECT USING (true);


CREATE TABLE public.questions (
    id serial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id integer NOT NULL REFERENCES public.products(id),
    question text NOT NULL,
    answer text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can ask questions" ON public.questions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "All users can view questions and answers" ON public.questions FOR SELECT USING (true);


-- REFUNDS
CREATE TABLE public.refunds (
    id serial PRIMARY KEY,
    order_id integer NOT NULL REFERENCES public.orders(id),
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    reason text,
    status text NOT NULL DEFAULT 'Pending',
    amount numeric(10, 2) NOT NULL,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own refunds" ON public.refunds FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- NOTIFICATIONS
CREATE TABLE public.notifications (
    id serial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Set up storage for user avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Anyone can update their own avatar."
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'avatars' );
