-- Drop existing tables in reverse order of dependency
DROP TABLE IF EXISTS public.product_tags CASCADE;
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.home_page_sections CASCADE;


-- Create categories table
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tags table
CREATE TABLE public.tags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    unit TEXT,
    price REAL NOT NULL DEFAULT 0,
    original_price REAL,
    stock INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft', -- e.g., 'draft', 'active', 'archived'
    featured_image_url TEXT,
    gallery_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_categories join table for many-to-many relationship
CREATE TABLE public.product_categories (
    product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);


-- Create product_tags join table for many-to-many relationship
CREATE TABLE public.product_tags (
    product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);

-- Create home_page_sections table
CREATE TABLE public.home_page_sections (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id),
  UNIQUE(display_order)
);


-- Function to update home page sections transactionally
CREATE OR REPLACE FUNCTION public.update_home_sections(sections_data jsonb)
RETURNS void AS $$
BEGIN
  -- First, clear the existing sections
  DELETE FROM public.home_page_sections;

  -- Then, insert the new sections from the JSON array
  INSERT INTO public.home_page_sections (category_id, display_order)
  SELECT
    (value->>'category_id')::INTEGER,
    (value->>'display_order')::INTEGER
  FROM jsonb_array_elements(sections_data);
END;
$$ LANGUAGE plpgsql;


-- RLS Policies for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone." ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin can insert products." ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can update products." ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete products." ON public.products FOR DELETE TO authenticated USING (true);

-- RLS Policies for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone." ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin can manage categories." ON public.categories FOR ALL TO authenticated USING (true);

-- RLS Policies for tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tags are viewable by everyone." ON public.tags FOR SELECT USING (true);
CREATE POLICY "Admin can manage tags." ON public.tags FOR ALL TO authenticated USING (true);

-- RLS Policies for product_categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product categories are viewable by everyone." ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Admin can manage product categories." ON public.product_categories FOR ALL TO authenticated USING (true);

-- RLS Policies for product_tags
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product tags are viewable by everyone." ON public.product_tags FOR SELECT USING (true);
CREATE POLICY "Admin can manage product tags." ON public.product_tags FOR ALL TO authenticated USING (true);

-- RLS Policies for home_page_sections
ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Home page sections are viewable by everyone." ON public.home_page_sections FOR SELECT USING (true);
CREATE POLICY "Admin can manage home page sections." ON public.home_page_sections FOR ALL TO authenticated USING (true);

-- Grant function execution to authenticated users
GRANT EXECUTE ON FUNCTION public.update_home_sections(jsonb) TO authenticated;
