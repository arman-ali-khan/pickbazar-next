-- Drop tables in reverse order of dependency to avoid errors
DROP TABLE IF EXISTS "public"."order_items" CASCADE;
DROP TABLE IF EXISTS "public"."orders" CASCADE;
DROP TABLE IF EXISTS "public"."reviews" CASCADE;
DROP TABLE IF EXISTS "public"."products" CASCADE;
DROP TABLE IF EXISTS "public"."categories" CASCADE;
DROP TABLE IF EXISTS "public"."wishlist_items" CASCADE;
DROP TABLE IF EXISTS "public"."wishlists" CASCADE;
DROP TABLE IF EXISTS "public"."cards" CASCADE;
DROP TABLE IF EXISTS "public"."addresses" CASCADE;
DROP TABLE IF EXISTS "public"."profiles" CASCADE;


-- Create Categories Table
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES public.categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Products Table
CREATE TABLE public.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    category_id INTEGER REFERENCES public.categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Profiles Table
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  contact_number TEXT,
  email TEXT
);

-- Create Addresses Table
CREATE TABLE public.addresses (
    id SERIAL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    address_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    country VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    zip VARCHAR(50),
    street_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Cards Table (stores non-sensitive info)
CREATE TABLE public.cards (
    id SERIAL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    card_type VARCHAR(50),
    last4 VARCHAR(4),
    expiry_month VARCHAR(2),
    expiry_year VARCHAR(4),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Orders Table
CREATE TABLE public.orders (
    id SERIAL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    order_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'Pending',
    total_amount NUMERIC(10, 2) NOT NULL,
    shipping_address_id INTEGER REFERENCES public.addresses(id)
);

-- Create Order Items Table
CREATE TABLE public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES public.products(id),
    quantity INTEGER NOT NULL,
    price_at_purchase NUMERIC(10, 2) NOT NULL
);

-- Create Wishlists Table
CREATE TABLE public.wishlists (
    id SERIAL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    name VARCHAR(255) DEFAULT 'My Wishlist',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Wishlist Items Table
CREATE TABLE public.wishlist_items (
    id SERIAL PRIMARY KEY,
    wishlist_id INTEGER NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES public.products(id),
    added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Reviews Table
CREATE TABLE public.reviews (
    id SERIAL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES public.products(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Questions Table
CREATE TABLE public.questions (
    id SERIAL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES public.products(id),
    question_text TEXT NOT NULL,
    answer_text TEXT,
    asked_at TIMESTAMPTZ DEFAULT NOW(),
    answered_at TIMESTAMPTZ
);

-- Enable Row Level Security for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert, update, and delete their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view, insert, update, and delete their own addresses." ON public.addresses;

-- Create new, simplified policies
-- For profiles table
CREATE POLICY "Profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert, update, and delete their own profile." ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- For addresses table
CREATE POLICY "Users can view, insert, update, and delete their own addresses." ON public.addresses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- Trigger function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  RETURN new;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable storage and create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Avatars policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;


CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can upload an avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can update their own avatar."
  ON storage.objects FOR UPDATE
  USING ( auth.uid() = owner )
  WITH CHECK ( bucket_id = 'avatars' );
