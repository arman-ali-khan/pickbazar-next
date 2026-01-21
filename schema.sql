-- Drop existing tables, policies, and functions to ensure a clean setup
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.product_views CASCADE;
DROP TABLE IF EXISTS public.search_history CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.refunds CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.wishlist_items CASCADE;
DROP TABLE IF EXISTS public.wishlists CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- Drop existing policies on the profiles table
DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual insert/update/delete access" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON "public"."profiles";
DROP POLICY IF EXISTS "Users can insert their own profile." ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update own profile." ON "public"."profiles";
DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.addresses;
DROP POLICY IF EXISTS "Enable read access for own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.addresses;


-- Drop the trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.create_public_profile_for_new_user();

-- User Profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  contact_number TEXT,
  email TEXT
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Addresses for Users
CREATE TABLE public.addresses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL, -- e.g., 'shipping', 'billing'
  title TEXT NOT NULL,
  country TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  street_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;


-- Products and Categories
CREATE TABLE public.products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2),
  image_url TEXT,
  image_hint TEXT,
  stock INT NOT NULL DEFAULT 0,
  weight TEXT, -- e.g., '1lb', '250g'
  sku TEXT UNIQUE,
  rating NUMERIC(3, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.categories (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id BIGINT REFERENCES public.categories(id)
);

CREATE TABLE public.product_categories (
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- Reviews
CREATE TABLE public.reviews (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE public.orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- e.g., 'Pending', 'Shipped', 'Delivered'
  total_amount NUMERIC(10, 2) NOT NULL,
  shipping_address_id BIGINT REFERENCES public.addresses(id),
  billing_address_id BIGINT REFERENCES public.addresses(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL,
  price_at_purchase NUMERIC(10, 2) NOT NULL
);

-- Wishlists
CREATE TABLE public.wishlists (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Wishlist',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.wishlist_items (
  wishlist_id BIGINT NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (wishlist_id, product_id)
);

-- Questions
CREATE TABLE public.questions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds
CREATE TABLE public.refunds (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL, -- e.g., 'Pending', 'Approved', 'Rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Cards (stores tokens, not actual card numbers)
CREATE TABLE public.cards (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_gateway_token TEXT NOT NULL, -- e.g., Stripe customer or card ID
  last4 TEXT,
  brand TEXT,
  expiry_month INT,
  expiry_year INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Activity
CREATE TABLE public.search_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Can be null for anonymous users
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.product_views (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Can be null for anonymous users
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Not recommended to store cart in DB for performance, but included as requested
CREATE TABLE public.cart_items (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  UNIQUE(user_id, product_id)
);


-- Function and Trigger to create a public profile for each new user
CREATE OR REPLACE FUNCTION public.create_public_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_public_profile_for_new_user();


-- RLS POLICIES --

-- Profiles
CREATE POLICY "Enable all actions for users based on user_id" ON "public"."profiles"
AS PERMISSIVE FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Addresses
CREATE POLICY "Enable insert for authenticated users only" ON "public"."addresses"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for own addresses" ON "public"."addresses"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON "public"."addresses"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
