-- ----------------------------------------------------------------
-- DATABASE MIGRATION: FULL SCHEMA AND FUNCTIONS
--
-- This script represents the complete and corrected database schema.
-- It can be run safely in your Supabase SQL Editor to reset and
-- fix the database structure after previous failed attempts.
--
-- It will:
-- 1. Drop old functions and types cleanly.
-- 2. Re-create all necessary types, tables, and functions from scratch.
-- 3. Set up appropriate permissions and triggers.
-- ----------------------------------------------------------------

-- Drop existing objects in reverse order of dependency
DROP FUNCTION IF EXISTS public.get_recommended_products(integer);
DROP FUNCTION IF EXISTS public.get_related_products(integer, integer);
DROP FUNCTION IF EXISTS public.get_admin_order_details(text);
DROP FUNCTION IF EXISTS public.create_order(double precision,jsonb,jsonb,public.order_status,text,double precision,text,jsonb);
DROP FUNCTION IF EXISTS public.update_home_sections(jsonb);

DROP TYPE IF EXISTS public.order_status CASCADE;

-- Create ENUM for order status
CREATE TYPE public.order_status AS ENUM (
    'Pending',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Failed'
);

-- Profiles Table
-- Holds public-facing user data
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    bio text,
    contact_number text,
    role text NOT NULL DEFAULT 'customer'::text,
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function to create a public profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    price double precision NOT NULL DEFAULT 0,
    original_price double precision,
    stock integer NOT NULL DEFAULT 0,
    unit text,
    status text NOT NULL DEFAULT 'draft'::text,
    featured_image_url text,
    gallery_urls text[],
    view_count integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone." ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products." ON public.products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update products." ON public.products FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete products." ON public.products FOR DELETE USING (public.is_admin());

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    parent_id bigint REFERENCES public.categories(id) ON DELETE SET NULL,
    icon text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone." ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories." ON public.categories FOR ALL USING (public.is_admin());

-- Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tags are viewable by everyone." ON public.tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage tags." ON public.tags FOR ALL USING (public.is_admin());

-- Product-Category Junction Table
CREATE TABLE IF NOT EXISTS public.product_categories (
    product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    category_id bigint NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product-categories links are public." ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage product-categories." ON public.product_categories FOR ALL USING (public.is_admin());

-- Product-Tag Junction Table
CREATE TABLE IF NOT EXISTS public.product_tags (
    product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    tag_id bigint NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product-tags links are public." ON public.product_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage product-tags." ON public.product_tags FOR ALL USING (public.is_admin());

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id),
    order_number text NOT NULL UNIQUE,
    total_amount double precision NOT NULL,
    status public.order_status NOT NULL DEFAULT 'Pending'::public.order_status,
    shipping_details jsonb,
    coupon_code text,
    discount_amount double precision,
    payment_method text,
    payment_details jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own orders." ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders." ON public.orders FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can create orders." ON public.orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update orders." ON public.orders FOR UPDATE USING (public.is_admin());

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id bigint NOT NULL REFERENCES public.products(id),
    quantity integer NOT NULL,
    price_at_purchase double precision NOT NULL
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own order items." ON public.order_items FOR SELECT USING (
    (SELECT user_id FROM public.orders WHERE id = order_id) = auth.uid()
);
CREATE POLICY "Admins can view all order items." ON public.order_items FOR SELECT USING (public.is_admin());
CREATE POLICY "Authenticated users can create order items." ON public.order_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    product_id bigint NOT NULL REFERENCES public.products(id),
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text text,
    status text NOT NULL DEFAULT 'Pending'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are public if approved." ON public.reviews FOR SELECT USING (status = 'Approved'::text);
CREATE POLICY "Users can create their own reviews." ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage reviews." ON public.reviews FOR ALL USING (public.is_admin());

-- Wishlist Table
CREATE TABLE IF NOT EXISTS public.wishlist (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    product_id bigint NOT NULL REFERENCES public.products(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own wishlist." ON public.wishlist FOR ALL USING (auth.uid() = user_id);

-- Other tables...
CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value text
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are public." ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings." ON public.settings FOR ALL USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text,
    email text,
    subject text,
    message text,
    status text DEFAULT 'unread'::text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage contact messages." ON public.contact_messages FOR ALL USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id),
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false,
    type text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications." ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view admin notifications." ON public.notifications FOR SELECT USING (user_id IS NULL AND public.is_admin());
CREATE POLICY "Admins can insert notifications." ON public.notifications FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Users can update their own notifications." ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update admin notifications." ON public.notifications FOR UPDATE USING (user_id IS NULL AND public.is_admin());

-- Add more table definitions here...

-- -----------------
-- HELPER FUNCTIONS
-- -----------------

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
    RETURN user_role IN ('admin', 'manager', 'super-admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- -----------------
-- RPC FUNCTIONS
-- -----------------

-- Function to get detailed information for a single order in the admin dashboard
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount double precision,
    status public.order_status,
    shipping_details jsonb,
    profiles jsonb,
    order_items jsonb,
    coupon_code text,
    discount_amount double precision,
    payment_method text,
    transaction_details jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        o.shipping_details,
        jsonb_build_object(
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ) AS profiles,
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', oi.id,
                'quantity', oi.quantity,
                'price_at_purchase', oi.price_at_purchase,
                'products', jsonb_build_object(
                    'name', pr.name,
                    'featured_image_url', pr.featured_image_url
                )
            )
        ) FROM order_items oi JOIN products pr ON oi.product_id = pr.id WHERE oi.order_id = o.id) AS order_items,
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.payment_details AS transaction_details
    FROM
        orders o
    LEFT JOIN
        profiles p ON o.user_id = p.id
    WHERE
        o.order_number = p_order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get related products based on shared categories and tags
-- This function scores products based on shared categories (2 points) and tags (1 point).
-- If no strongly related products are found, it falls back to products in the same primary category.
CREATE OR REPLACE FUNCTION get_related_products(p_id integer, p_limit integer)
RETURNS TABLE(
    id integer,
    name text,
    price double precision,
    original_price double precision,
    featured_image_url text,
    unit text
) AS $$
DECLARE
    primary_category_id bigint;
BEGIN
    -- Get the primary category of the product
    SELECT category_id INTO primary_category_id
    FROM product_categories
    WHERE product_id = p_id
    ORDER BY category_id
    LIMIT 1;

    RETURN QUERY
    WITH product_cats AS (
        SELECT category_id FROM product_categories WHERE product_id = p_id
    ),
    product_tags_list AS (
        SELECT tag_id FROM product_tags WHERE product_id = p_id
    ),
    scored_products AS (
        SELECT
            p.id,
            p.name,
            p.price,
            p.original_price,
            p.featured_image_url,
            p.unit,
            p.view_count,
            (
                (SELECT COUNT(*) FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id IN (SELECT category_id FROM product_cats)) * 2 +
                (SELECT COUNT(*) FROM product_tags pt WHERE pt.product_id = p.id AND pt.tag_id IN (SELECT tag_id FROM product_tags_list))
            ) as relevance_score
        FROM products p
        WHERE p.id != p_id AND p.status = 'active'
    )
    -- First, try to get products with a relevance score > 0
    SELECT sp.id, sp.name, sp.price, sp.original_price, sp.featured_image_url, sp.unit
    FROM scored_products sp
    WHERE sp.relevance_score > 0
    ORDER BY sp.relevance_score DESC, sp.view_count DESC NULLS LAST
    LIMIT p_limit

    -- If the above returns fewer than p_limit results, union with same-category products
    UNION ALL

    SELECT
        p.id,
        p.name,
        p.price,
        p.original_price,
        p.featured_image_url,
        p.unit
    FROM products p
    JOIN product_categories pc ON p.id = pc.product_id
    WHERE
        p.id != p_id
        AND p.status = 'active'
        AND pc.category_id = primary_category_id
        AND p.id NOT IN (SELECT sp.id FROM scored_products sp WHERE sp.relevance_score > 0)
    ORDER BY p.view_count DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get recommended products based on sales, views, and creation date.
-- Falls back to newest products if no other metrics are available.
CREATE OR REPLACE FUNCTION get_recommended_products(p_limit integer)
RETURNS TABLE(
    id integer,
    name text,
    price double precision,
    original_price double precision,
    featured_image_url text,
    unit text
) AS $$
BEGIN
    RETURN QUERY
    WITH product_scores AS (
        SELECT
            p.id,
            p.name,
            p.price,
            p.original_price,
            p.featured_image_url,
            p.unit,
            p.created_at,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) as sales_count,
            COALESCE(p.view_count, 0) as views
        FROM
            products p
        WHERE p.status = 'active'
    )
    SELECT
        ps.id,
        ps.name,
        ps.price,
        ps.original_price,
        ps.featured_image_url,
        ps.unit
    FROM
        product_scores ps
    ORDER BY
        -- Weighted score
        (ps.sales_count * 0.7) + (ps.views * 0.3) DESC,
        ps.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new order
CREATE OR REPLACE FUNCTION create_order(
    p_total_amount double precision,
    p_shipping_details jsonb,
    p_items jsonb,
    p_initial_status public.order_status DEFAULT 'Pending'::public.order_status,
    p_coupon_code text DEFAULT NULL,
    p_discount_amount double precision DEFAULT 0,
    p_payment_method text DEFAULT 'cod',
    p_transaction_details jsonb DEFAULT NULL
) RETURNS text AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item jsonb;
BEGIN
    -- Generate a unique order number
    new_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || trim(to_char(nextval('orders_id_seq'), '000000'));

    -- Insert into orders table
    INSERT INTO public.orders (user_id, order_number, total_amount, shipping_details, coupon_code, discount_amount, status, payment_method, payment_details)
    VALUES (auth.uid(), new_order_number, p_total_amount, p_shipping_details, p_coupon_code, p_discount_amount, p_initial_status, p_payment_method, p_transaction_details)
    RETURNING id INTO new_order_id;

    -- Insert into order_items table
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, (item->>'product_id')::bigint, (item->>'quantity')::integer, (item->>'price')::double precision);
    END LOOP;

    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to update home page sections
CREATE OR REPLACE FUNCTION update_home_sections(sections_data jsonb)
RETURNS void AS $$
BEGIN
    -- Clear existing sections
    DELETE FROM public.home_page_sections;
    -- Insert new sections
    INSERT INTO public.home_page_sections (category_id, display_order)
    SELECT
        (value->>'category_id')::int,
        (value->>'display_order')::int
    FROM jsonb_array_elements(sections_data);
END;
$$ LANGUAGE plpgsql;

-- Add other RPC functions here...
-- ...

-- Ensure RLS is enabled on all relevant tables
-- (This is a safety check; previous statements should have already done this)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Grant usage on the public schema to the authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant execution on functions to the authenticated role
GRANT EXECUTE ON FUNCTION public.create_order(double precision,jsonb,jsonb,public.order_status,text,double precision,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommended_products(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_related_products(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_order_details(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_home_sections(jsonb) TO authenticated;


-- Grant permissions to supabase_admin to execute all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO supabase_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO supabase_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO supabase_admin;

-- Grant permissions for anon role (public access)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.tags TO anon;
GRANT SELECT ON public.product_categories TO anon;
GRANT SELECT ON public.product_tags TO anon;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.settings TO anon;
GRANT INSERT ON public.contact_messages TO anon;

GRANT EXECUTE ON FUNCTION public.get_recommended_products(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_related_products(integer, integer) TO anon;
