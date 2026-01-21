-- This script is idempotent and can be run multiple times safely.

-- ##############################
-- ### PROFILES TABLE SETUP ###
-- ##############################

-- Ensure RLS is enabled on the profiles table.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure this script is re-runnable
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ##############################
-- ### CATEGORIES TABLE SETUP ###
-- ##############################
DROP TABLE IF EXISTS public.categories CASCADE;
CREATE TABLE public.categories (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text UNIQUE,
    description text,
    parent_id bigint REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.categories IS 'Stores product categories and sub-categories';

-- Enable RLS and define policies for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are viewable by everyone." ON public.categories;
CREATE POLICY "Categories are viewable by everyone." ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can manage categories." ON public.categories;
CREATE POLICY "Authenticated users can manage categories." ON public.categories FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- ##############################
-- ### TAGS TABLE SETUP ###
-- ##############################
DROP TABLE IF EXISTS public.tags CASCADE;
CREATE TABLE public.tags (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    slug text UNIQUE,
    created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.tags IS 'Stores product tags';

-- Enable RLS and define policies for tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tags are viewable by everyone." ON public.tags;
CREATE POLICY "Tags are viewable by everyone." ON public.tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can manage tags." ON public.tags;
CREATE POLICY "Authenticated users can manage tags." ON public.tags FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- ##############################
-- ### PRODUCTS TABLE SETUP ###
-- ##############################
DROP TABLE IF EXISTS public.products CASCADE;
CREATE TABLE public.products (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text UNIQUE,
    description text,
    unit text,
    price numeric NOT NULL DEFAULT 0,
    original_price numeric,
    stock integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'draft',
    category_id bigint REFERENCES public.categories(id) ON DELETE SET NULL,
    featured_image_url text,
    gallery_urls text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.products IS 'Stores product information';

-- Enable RLS and define policies for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are viewable by everyone." ON public.products;
CREATE POLICY "Products are viewable by everyone." ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can manage products." ON public.products;
CREATE POLICY "Authenticated users can manage products." ON public.products FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- ####################################
-- ### PRODUCT_TAGS (JOIN) TABLE SETUP ###
-- ####################################
DROP TABLE IF EXISTS public.product_tags;
CREATE TABLE public.product_tags (
    product_id bigint REFERENCES public.products(id) ON DELETE CASCADE,
    tag_id bigint REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);
COMMENT ON TABLE public.product_tags IS 'Joins products and tags';

-- Enable RLS and define policies for product_tags
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Product tags are viewable by everyone." ON public.product_tags;
CREATE POLICY "Product tags are viewable by everyone." ON public.product_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can manage product_tags." ON public.product_tags;
CREATE POLICY "Authenticated users can manage product_tags." ON public.product_tags FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- ##############################
-- ### CARDS TABLE SETUP ###
-- ##############################
DROP TABLE IF EXISTS public.cards;
CREATE TABLE public.cards (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    card_type text,
    last4 text,
    expiry_month integer,
    expiry_year integer,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own cards." ON public.cards;
CREATE POLICY "Users can manage their own cards." ON public.cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ##############################
-- ### ADDRESSES TABLE SETUP ###
-- ##############################
DROP TABLE IF EXISTS public.addresses;
CREATE TABLE public.addresses (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    address_type text,
    title text,
    country text,
    city text,
    state text,
    zip text,
    street_address text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own addresses." ON public.addresses;
CREATE POLICY "Users can manage their own addresses." ON public.addresses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ##############################
-- ### AUTO-UPDATE TIMESTAMPS ###
-- ##############################
-- Create function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for products table
DROP TRIGGER IF EXISTS on_products_updated ON public.products;
CREATE TRIGGER on_products_updated
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add updated_at to profiles if it doesn't exist from a previous run
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();


-- ##############################
-- ### RELOAD SCHEMA CACHE ###
-- ##############################
-- Force schema reload for Supabase API to recognize new tables
NOTIFY pgrst, 'reload schema';
