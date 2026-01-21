-- Drop existing tables in an order that respects dependencies, using CASCADE
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.product_tags CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing policies just in case
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own addresses." ON public.addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses." ON public.addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses." ON public.addresses;
DROP POLICY IF EXISTS "Users can view their own cards." ON public.cards;
DROP POLICY IF EXISTS "Users can insert their own cards." ON public.cards;
DROP POLICY IF EXISTS "Users can delete their own cards." ON public.cards;
DROP POLICY IF EXISTS "Categories are viewable by everyone." ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories." ON public.categories;
DROP POLICY IF EXISTS "Tags are viewable by everyone." ON public.tags;
DROP POLICY IF EXISTS "Authenticated users can manage tags." ON public.tags;
DROP POLICY IF EXISTS "Products are viewable by everyone." ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products." ON public.products;
DROP POLICY IF EXISTS "Product tags are viewable by everyone." ON public.product_tags;
DROP POLICY IF EXISTS "Authenticated users can manage product tags." ON public.product_tags;
DROP POLICY IF EXISTS "Users can view their own orders." ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders." ON public.orders;
DROP POLICY IF EXISTS "Users can view their own order items." ON public.order_items;

-- Drop existing trigger function if it exists
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  bio text,
  contact_number text,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create addresses table
CREATE TABLE public.addresses (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  address_type text NOT NULL,
  title text NOT NULL,
  country text,
  city text,
  state text,
  zip text,
  street_address text
);

-- Create cards table
CREATE TABLE public.cards (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  card_type text,
  last4 text,
  expiry_month integer,
  expiry_year integer
);

-- Create categories table
CREATE TABLE public.categories (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now() NOT NULL,
  name text,
  slug text UNIQUE,
  description text,
  parent_id bigint REFERENCES public.categories(id) ON DELETE SET NULL
);

-- Create tags table
CREATE TABLE public.tags (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now() NOT NULL,
  name text,
  slug text UNIQUE
);

-- Create products table
CREATE TABLE public.products (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now() NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  unit text,
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  stock integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  category_id bigint REFERENCES public.categories(id) ON DELETE SET NULL,
  featured_image_url text,
  gallery_urls text[]
);

-- Create product_tags junction table
CREATE TABLE public.product_tags (
  product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id bigint NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- Create orders table
CREATE TABLE public.orders (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    total NUMERIC NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT,
    shipping_address_id BIGINT REFERENCES public.addresses(id) ON DELETE SET NULL
);

-- Create order_items table
CREATE TABLE public.order_items (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL
);


-- Enable Row Level Security for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create Security Policies
-- Profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Addresses
CREATE POLICY "Users can view their own addresses." ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addresses." ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own addresses." ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- Cards
CREATE POLICY "Users can view their own cards." ON public.cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cards." ON public.cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cards." ON public.cards FOR DELETE USING (auth.uid() = user_id);

-- Categories
CREATE POLICY "Categories are viewable by everyone." ON public.categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage categories." ON public.categories FOR ALL USING (auth.role() = 'authenticated');

-- Tags
CREATE POLICY "Tags are viewable by everyone." ON public.tags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage tags." ON public.tags FOR ALL USING (auth.role() = 'authenticated');

-- Products
CREATE POLICY "Products are viewable by everyone." ON public.products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage products." ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- Product Tags
CREATE POLICY "Product tags are viewable by everyone." ON public.product_tags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage product tags." ON public.product_tags FOR ALL USING (auth.role() = 'authenticated');

-- Orders & Order Items
CREATE POLICY "Users can view their own orders." ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders." ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own order items." ON public.order_items FOR SELECT USING ((SELECT user_id FROM public.orders WHERE id = order_id) = auth.uid());


-- Function and Trigger to automatically update 'updated_at' column
CREATE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
