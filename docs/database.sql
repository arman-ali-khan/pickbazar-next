-- ----------------------------------------------------------------
-- DATABASE MIGRATION: Idempotent Schema Setup for Pickbazar
--
-- This script is designed to be run multiple times safely.
-- It creates tables, types, functions, and policies if they
-- don't exist, and updates them if they do.
--
-- You can run this entire script in your Supabase SQL Editor.
-- ----------------------------------------------------------------

-- Create ENUM types only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM (
            'Pending',
            'Processing',
            'Shipped',
            'Delivered',
            'Cancelled'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'address_type') THEN
        CREATE TYPE public.address_type AS ENUM (
            'billing',
            'shipping'
        );
    END IF;
END$$;

-- Create sequences for tables
CREATE SEQUENCE IF NOT EXISTS public.addresses_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.cards_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.categories_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.contact_messages_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.home_page_sections_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.notifications_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.offers_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.order_items_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.order_status_history_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.orders_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.pages_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.products_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.promos_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.questions_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.refunds_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.reviews_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.tags_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.transactions_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.wishlist_id_seq;


-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    bio text,
    contact_number text,
    role text DEFAULT 'customer'::text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.addresses (
    id bigint NOT NULL DEFAULT nextval('addresses_id_seq'::regclass) PRIMARY KEY,
    user_id uuid REFERENCES public.profiles ON DELETE CASCADE,
    address_type public.address_type,
    title text,
    country text,
    city text,
    state text,
    zip text,
    street_address text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cards (
    id bigint NOT NULL DEFAULT nextval('cards_id_seq'::regclass) PRIMARY KEY,
    user_id uuid REFERENCES public.profiles ON DELETE CASCADE,
    card_type text,
    last4 text,
    expiry_month integer,
    expiry_year integer,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id bigint NOT NULL DEFAULT nextval('categories_id_seq'::regclass) PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    icon text,
    image_url text,
    description text,
    parent_id bigint REFERENCES public.categories ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tags (
    id bigint NOT NULL DEFAULT nextval('tags_id_seq'::regclass) PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
    id bigint NOT NULL DEFAULT nextval('products_id_seq'::regclass) PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    featured_image_url text,
    gallery_urls text[],
    price double precision NOT NULL,
    original_price double precision,
    unit text,
    stock integer DEFAULT 0,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
-- Add view_count if it doesn't exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;


CREATE TABLE IF NOT EXISTS public.product_categories (
    product_id bigint NOT NULL REFERENCES public.products ON DELETE CASCADE,
    category_id bigint NOT NULL REFERENCES public.categories ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.product_tags (
    product_id bigint NOT NULL REFERENCES public.products ON DELETE CASCADE,
    tag_id bigint NOT NULL REFERENCES public.tags ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.orders (
    id bigint NOT NULL DEFAULT nextval('orders_id_seq'::regclass) PRIMARY KEY,
    user_id uuid REFERENCES public.profiles ON DELETE SET NULL,
    order_number text UNIQUE,
    total_amount numeric(10,2) NOT NULL,
    status public.order_status DEFAULT 'Pending'::public.order_status,
    shipping_details jsonb,
    payment_details jsonb,
    coupon_code text,
    discount_amount numeric(10,2),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint NOT NULL DEFAULT nextval('order_items_id_seq'::regclass) PRIMARY KEY,
    order_id bigint NOT NULL REFERENCES public.orders ON DELETE CASCADE,
    product_id bigint REFERENCES public.products ON DELETE SET NULL,
    quantity integer NOT NULL,
    price_at_purchase numeric(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id bigint NOT NULL DEFAULT nextval('transactions_id_seq'::regclass) PRIMARY KEY,
    order_id bigint NOT NULL REFERENCES public.orders ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles ON DELETE SET NULL,
    amount numeric(10,2) NOT NULL,
    payment_method text,
    status text,
    transaction_details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id bigint NOT NULL DEFAULT nextval('reviews_id_seq'::regclass) PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
    product_id bigint NOT NULL REFERENCES public.products ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text text,
    status text DEFAULT 'Pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.questions (
    id bigint NOT NULL DEFAULT nextval('questions_id_seq'::regclass) PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
    product_id bigint NOT NULL REFERENCES public.products ON DELETE CASCADE,
    question_text text NOT NULL,
    answer_text text,
    status text DEFAULT 'Pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    answered_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.wishlist (
    id bigint NOT NULL DEFAULT nextval('wishlist_id_seq'::regclass) PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
    product_id bigint NOT NULL REFERENCES public.products ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value text,
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pages (
    id bigint NOT NULL DEFAULT nextval('pages_id_seq'::regclass) PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    content jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint NOT NULL DEFAULT nextval('notifications_id_seq'::regclass) PRIMARY KEY,
    user_id uuid REFERENCES public.profiles ON DELETE CASCADE,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false,
    type text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id bigint NOT NULL DEFAULT nextval('contact_messages_id_seq'::regclass) PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    subject text,
    message text NOT NULL,
    status text DEFAULT 'unread'::text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.refunds (
    id bigint NOT NULL DEFAULT nextval('refunds_id_seq'::regclass) PRIMARY KEY,
    order_id bigint NOT NULL REFERENCES public.orders ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
    amount numeric(10,2) NOT NULL,
    reason text,
    status text DEFAULT 'Pending'::text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id bigint NOT NULL DEFAULT nextval('order_status_history_id_seq'::regclass) PRIMARY KEY,
    order_id bigint NOT NULL REFERENCES public.orders ON DELETE CASCADE,
    status public.order_status NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offers (
    id bigint NOT NULL DEFAULT nextval('offers_id_seq'::regclass) PRIMARY KEY,
    title text NOT NULL,
    subtitle text,
    code text NOT NULL UNIQUE,
    discount_percentage numeric(5,2) NOT NULL,
    status text DEFAULT 'inactive'::text NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    image_url text,
    category_ids bigint[],
    product_ids bigint[],
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promos (
    id bigint NOT NULL DEFAULT nextval('promos_id_seq'::regclass) PRIMARY KEY,
    title text NOT NULL,
    subtitle text,
    button_text text,
    button_link text,
    image_url text,
    status text DEFAULT 'inactive'::text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.home_page_sections (
    id bigint NOT NULL DEFAULT nextval('home_page_sections_id_seq'::regclass) PRIMARY KEY,
    category_id bigint NOT NULL UNIQUE REFERENCES public.categories ON DELETE CASCADE,
    display_order integer NOT NULL
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;
CREATE POLICY "Users can manage their own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own cards" ON public.cards;
CREATE POLICY "Users can manage their own cards" ON public.cards FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own orders." ON public.orders;
CREATE POLICY "Users can view their own orders." ON public.orders FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own reviews." ON public.reviews;
CREATE POLICY "Users can manage their own reviews." ON public.reviews FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews" ON public.reviews FOR SELECT USING (status = 'Approved');

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own wishlist." ON public.wishlist;
CREATE POLICY "Users can manage their own wishlist." ON public.wishlist FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their own notifications." ON public.notifications;
CREATE POLICY "Users can see their own notifications." ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own notifications." ON public.notifications;
CREATE POLICY "Users can update their own notifications." ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own refund requests." ON public.refunds;
CREATE POLICY "Users can manage their own refund requests." ON public.refunds FOR ALL USING (auth.uid() = user_id);

-- Functions
-- Function to create a new user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;
-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the initial status when a new order is created
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.order_status_history (order_id, status, created_at)
        VALUES (NEW.id, NEW.status, NOW());
    -- Log status change when an order is updated
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            INSERT INTO public.order_status_history (order_id, status, created_at)
            VALUES (NEW.id, NEW.status, NOW());
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger for order status logging
DROP TRIGGER IF EXISTS log_order_status_change_trigger ON public.orders;
CREATE TRIGGER log_order_status_change_trigger
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();


-- Function to get a user's role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id uuid)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = p_user_id;
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to update order status and return details for notification
-- This version corrects the ambiguity by using a single function definition.
DROP FUNCTION IF EXISTS public.update_order_status_and_log(p_order_id => bigint, p_new_status => public.order_status);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(p_order_id => bigint, p_new_status => text);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(p_order_id => integer, p_new_status => text);

CREATE OR REPLACE FUNCTION update_order_status_and_log(p_order_id bigint, p_new_status text)
RETURNS TABLE (
    user_id uuid,
    order_number text
) AS $$
DECLARE
    v_new_status public.order_status;
BEGIN
    v_new_status := p_new_status::public.order_status;

    UPDATE public.orders
    SET status = v_new_status
    WHERE id = p_order_id;

    RETURN QUERY
    SELECT o.user_id, o.order_number
    FROM public.orders o
    WHERE o.id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create an order
CREATE OR REPLACE FUNCTION create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status text DEFAULT 'Pending'
)
RETURNS text AS $$
DECLARE
    v_order_id bigint;
    v_order_number text;
    v_user_id uuid := auth.uid();
    v_item jsonb;
    v_status public.order_status;
BEGIN
    v_status := p_initial_status::public.order_status;

    -- Generate a unique order number
    v_order_number := 'KB-' || to_char(NOW(), 'YYYYMMDD') || '-' || nextval('orders_id_seq');

    -- Insert the order
    INSERT INTO public.orders (user_id, order_number, total_amount, status, shipping_details, coupon_code, discount_amount)
    VALUES (v_user_id, v_order_number, p_total_amount, v_status, p_shipping_details, p_coupon_code, p_discount_amount)
    RETURNING id INTO v_order_id;

    -- Insert order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (v_order_id, (v_item->>'product_id')::bigint, (v_item->>'quantity')::int, (v_item->>'price')::numeric);
    END LOOP;

    -- Insert transaction record
    INSERT INTO public.transactions (order_id, user_id, amount, payment_method, status, transaction_details)
    VALUES (v_order_id, v_user_id, p_total_amount, p_payment_method, 'Completed', p_transaction_details);

    RETURN v_order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get related products based on shared categories and tags
-- This function scores products based on shared categories (2 points) and tags (1 point).
CREATE OR REPLACE FUNCTION get_related_products(p_id integer, p_limit integer)
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
    WITH target_product_cats AS (
        SELECT category_id FROM product_categories WHERE product_id = p_id
    ),
    target_product_tags AS (
        SELECT tag_id FROM product_tags WHERE product_id = p_id
    ),
    product_scores AS (
        SELECT
            p.id,
            p.name,
            p.price,
            p.original_price,
            p.featured_image_url,
            p.unit,
            p.view_count,
            p.created_at,
            (
                (SELECT count(*) FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id IN (SELECT category_id FROM target_product_cats)) * 2 +
                (SELECT count(*) FROM product_tags pt WHERE pt.product_id = p.id AND pt.tag_id IN (SELECT tag_id FROM target_product_tags))
            ) AS score
        FROM products p
        WHERE p.id != p_id AND p.status = 'active'
    )
    SELECT
        s.id,
        s.name,
        s.price,
        s.original_price,
        s.featured_image_url,
        s.unit
    FROM product_scores s
    WHERE s.score > 0
    ORDER BY s.score DESC, s.view_count DESC NULLS LAST, s.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get recommended products based on views, sales, and wishlist counts
-- This function calculates a weighted score for each product to determine recommendations.
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
            p.view_count,
            p.created_at,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) as sales_count,
            (SELECT COUNT(*) FROM wishlist w WHERE w.product_id = p.id) as wishlist_count
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
        (ps.sales_count * 0.5) + (ps.wishlist_count * 0.3) + (COALESCE(ps.view_count, 0) * 0.2) DESC,
        ps.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Other RPC functions
CREATE OR REPLACE FUNCTION get_all_settings()
RETURNS TABLE (
    site_title text,
    site_subtitle text,
    logo_url text,
    favicon_url text,
    link_preview_image_url text,
    meta_title text,
    meta_description text,
    meta_tags text,
    canonical_url text,
    og_title text,
    og_description text,
    enable_cod boolean,
    enable_mobile_banking boolean,
    enable_card_payment boolean,
    maintenance_mode boolean,
    maintenance_title text,
    maintenance_description text,
    maintenance_cover_image_url text,
    maintenance_end_date text,
    enable_promo_popup boolean,
    social_links jsonb,
    mobile_banking_number text,
    mobile_banking_options jsonb,
    shipping_cost numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT value FROM settings WHERE key = 'site_title'),
        (SELECT value FROM settings WHERE key = 'site_subtitle'),
        (SELECT value FROM settings WHERE key = 'logo_url'),
        (SELECT value FROM settings WHERE key = 'favicon_url'),
        (SELECT value FROM settings WHERE key = 'link_preview_image_url'),
        (SELECT value FROM settings WHERE key = 'meta_title'),
        (SELECT value FROM settings WHERE key = 'meta_description'),
        (SELECT value FROM settings WHERE key = 'meta_tags'),
        (SELECT value FROM settings WHERE key = 'canonical_url'),
        (SELECT value FROM settings WHERE key = 'og_title'),
        (SELECT value FROM settings WHERE key = 'og_description'),
        (SELECT value FROM settings WHERE key = 'enable_cod')::boolean,
        (SELECT value FROM settings WHERE key = 'enable_mobile_banking')::boolean,
        (SELECT value FROM settings WHERE key = 'enable_card_payment')::boolean,
        (SELECT value FROM settings WHERE key = 'maintenance_mode')::boolean,
        (SELECT value FROM settings WHERE key = 'maintenance_title'),
        (SELECT value FROM settings WHERE key = 'maintenance_description'),
        (SELECT value FROM settings WHERE key = 'maintenance_cover_image_url'),
        (SELECT value FROM settings WHERE key = 'maintenance_end_date'),
        (SELECT value FROM settings WHERE key = 'enable_promo_popup')::boolean,
        (SELECT value::jsonb FROM settings WHERE key = 'social_links'),
        (SELECT value FROM settings WHERE key = 'mobile_banking_number'),
        (SELECT value::jsonb FROM settings WHERE key = 'mobile_banking_options'),
        (SELECT value::numeric FROM settings WHERE key = 'shipping_cost');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_product_view(product_id_to_inc integer)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET view_count = view_count + 1
    WHERE id = product_id_to_inc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION toggle_wishlist_item(p_user_id uuid, p_product_id integer)
RETURNS TABLE (status text) AS $$
DECLARE
    v_wishlist_id bigint;
BEGIN
    SELECT id INTO v_wishlist_id FROM wishlist WHERE user_id = p_user_id AND product_id = p_product_id;

    IF v_wishlist_id IS NOT NULL THEN
        DELETE FROM wishlist WHERE id = v_wishlist_id;
        RETURN QUERY SELECT 'removed'::text;
    ELSE
        INSERT INTO wishlist (user_id, product_id) VALUES (p_user_id, p_product_id);
        RETURN QUERY SELECT 'added'::text;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_wishlist_ids(p_user_id uuid)
RETURNS TABLE (product_id integer) AS $$
BEGIN
    RETURN QUERY
    SELECT w.product_id FROM wishlist w WHERE w.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant usage on sequences for anon and authenticated roles
GRANT USAGE, SELECT ON SEQUENCE addresses_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE cards_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE categories_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE contact_messages_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE home_page_sections_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE offers_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE order_items_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE order_status_history_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE orders_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE pages_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE products_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE promos_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE questions_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE refunds_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE reviews_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE tags_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE transactions_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE wishlist_id_seq TO anon, authenticated;

-- Grant permissions for all tables to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.addresses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cards TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contact_messages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.home_page_sections TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.offers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_status_history TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_tags TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.promos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.questions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.refunds TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reviews TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tags TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wishlist TO anon, authenticated;
