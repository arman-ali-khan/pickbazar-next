-- Drop existing objects in reverse dependency order to be safe.
DROP TABLE IF EXISTS public.order_items;
DROP TABLE IF EXISTS public.orders;
DROP TABLE IF EXISTS public.product_tags;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.cards;
DROP TABLE IF EXISTS public.addresses;
DROP TABLE IF EXISTS public.tags;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.profiles;

-- Create public.profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    contact_number TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Profile data for each user.';
COMMENT ON COLUMN public.profiles.id IS 'References the internal Supabase auth user.';

-- Create public.categories table
CREATE TABLE public.categories (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.categories IS 'Stores product categories and sub-categories.';

-- Create public.tags table
CREATE TABLE public.tags (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.tags IS 'Stores product tags.';

-- Create public.products table
CREATE TABLE public.products (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    unit TEXT,
    price REAL NOT NULL CHECK (price >= 0),
    original_price REAL CHECK (original_price >= 0),
    stock INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
    featured_image_url TEXT,
    gallery_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.products IS 'Stores product information.';

-- Create public.product_tags join table
CREATE TABLE public.product_tags (
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);
COMMENT ON TABLE public.product_tags IS 'Associates products with tags.';

-- Create public.addresses table
CREATE TABLE public.addresses (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    address_type TEXT NOT NULL,
    title TEXT,
    country TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    street_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.addresses IS 'Stores user shipping and billing addresses.';

-- Create public.cards table
CREATE TABLE public.cards (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    card_type TEXT,
    last4 TEXT,
    expiry_month INT,
    expiry_year INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.cards IS 'Stores user payment card information (last 4 digits only).';

-- Create public.orders table
CREATE TABLE public.orders (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shipping_address_id BIGINT REFERENCES public.addresses(id) ON DELETE SET NULL,
    billing_address_id BIGINT REFERENCES public.addresses(id) ON DELETE SET NULL,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.orders IS 'Stores customer order information.';

-- Create public.order_items table
CREATE TABLE public.order_items (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    price REAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.order_items IS 'Stores individual items within an order.';


-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for categories, tags (assuming public read, but restricted write)
DROP POLICY IF EXISTS "Categories are viewable by everyone." ON public.categories;
CREATE POLICY "Categories are viewable by everyone." ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can manage categories." ON public.categories;
CREATE POLICY "Authenticated users can manage categories." ON public.categories FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tags are viewable by everyone." ON public.tags;
CREATE POLICY "Tags are viewable by everyone." ON public.tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can manage tags." ON public.tags;
CREATE POLICY "Authenticated users can manage tags." ON public.tags FOR ALL USING (auth.role() = 'authenticated');

-- Policies for products
DROP POLICY IF EXISTS "Products are viewable by everyone." ON public.products;
CREATE POLICY "Products are viewable by everyone." ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can manage products." ON public.products;
CREATE POLICY "Authenticated users can manage products." ON public.products FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can manage product_tags." ON public.product_tags;
CREATE POLICY "Authenticated users can manage product_tags." ON public.product_tags FOR ALL USING (auth.role() = 'authenticated');

-- Policies for addresses
DROP POLICY IF EXISTS "Users can manage their own addresses." ON public.addresses;
CREATE POLICY "Users can manage their own addresses." ON public.addresses FOR ALL USING (auth.uid() = user_id);

-- Policies for cards
DROP POLICY IF EXISTS "Users can manage their own cards." ON public.cards;
CREATE POLICY "Users can manage their own cards." ON public.cards FOR ALL USING (auth.uid() = user_id);

-- Policies for orders
DROP POLICY IF EXISTS "Users can view their own orders." ON public.orders;
CREATE POLICY "Users can view their own orders." ON public.orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own orders." ON public.orders;
CREATE POLICY "Users can create their own orders." ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for order_items
DROP POLICY IF EXISTS "Users can view their own order items." ON public.order_items;
CREATE POLICY "Users can view their own order items." ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can create items for their own orders." ON public.order_items;
CREATE POLICY "Users can create items for their own orders." ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);


-- Set up storage buckets and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;
CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'avatars');


INSERT INTO storage.buckets (id, name, public)
VALUES ('product_images', 'product_images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Product images are publicly accessible." ON storage.objects;
CREATE POLICY "Product images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'product_images');
DROP POLICY IF EXISTS "Authenticated users can upload product images." ON storage.objects;
CREATE POLICY "Authenticated users can upload product images." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product_images' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can update product images." ON storage.objects;
CREATE POLICY "Authenticated users can update product images." ON storage.objects FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (bucket_id = 'product_images');


-- Set up Realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
