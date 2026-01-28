-- This is the full, idempotent database schema for the Pickbazar application.
-- It is designed to be run safely multiple times without causing errors.
--
-- Running this script will:
-- 1. Create necessary types and tables if they don't exist.
-- 2. Create sequences for auto-incrementing IDs.
-- 3. Set up functions and triggers for data management.
-- 4. Apply Row Level Security (RLS) policies.
-- 5. Insert initial data for pages, settings, and other essentials.
--
-- To use this file:
-- 1. Go to your Supabase project's SQL Editor.
-- 2. Paste the entire content of this file into the editor.
-- 3. Click "Run".

-- ----------------------------------------------------------------
-- EXTENSIONS
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "extensions";

-- ----------------------------------------------------------------
-- TYPES
-- ----------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM (
            'Pending',
            'Processing',
            'Shipped',
            'Delivered',
            'Cancelled',
            'Failed'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'customer',
            'manager',
            'admin',
            'super-admin'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
      CREATE TYPE public.notification_type AS ENUM (
          'new_order',
          'order_update',
          'new_refund',
          'refund_update',
          'new_review',
          'new_question',
          'question_answered',
          'new_message',
          'role_update',
          'promotion',
          'security'
      );
    END IF;
END$$;


-- ----------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    updated_at timestamp with time zone,
    full_name text,
    avatar_url text,
    bio text,
    contact_number text,
    role user_role DEFAULT 'customer'::user_role NOT NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.addresses (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    address_type text,
    title text,
    country text,
    city text,
    state text,
    zip text,
    street_address text,
    CONSTRAINT addresses_pkey PRIMARY KEY (id),
    CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.cards (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    card_type text,
    last4 text,
    expiry_month integer,
    expiry_year integer,
    CONSTRAINT cards_pkey PRIMARY KEY (id),
    CONSTRAINT cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.categories (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    parent_id bigint,
    icon text,
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_slug_key UNIQUE (slug),
    CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    email text,
    subject text,
    message text,
    status text DEFAULT 'unread'::text,
    CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.home_page_sections (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    category_id bigint,
    display_order integer,
    CONSTRAINT home_page_sections_pkey PRIMARY KEY (id),
    CONSTRAINT home_page_sections_category_id_key UNIQUE (category_id),
    CONSTRAINT home_page_sections_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false,
    type notification_type,
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.offers (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    code text NOT NULL,
    status text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    image_url text,
    title text,
    subtitle text,
    discount_percentage numeric,
    product_ids bigint[],
    category_ids bigint[],
    CONSTRAINT offers_pkey PRIMARY KEY (id),
    CONSTRAINT offers_code_key UNIQUE (code)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint NOT NULL,
    order_id bigint,
    product_id integer,
    quantity integer,
    price_at_purchase numeric,
    CONSTRAINT order_items_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.orders (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    total_amount numeric,
    status order_status DEFAULT 'Pending'::order_status,
    shipping_details jsonb,
    order_number text,
    payment_method text,
    payment_details jsonb,
    coupon_code text,
    discount_amount numeric,
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT orders_order_number_key UNIQUE (order_number),
    CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.pages (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    content jsonb,
    updated_at timestamp with time zone,
    CONSTRAINT pages_pkey PRIMARY KEY (id),
    CONSTRAINT pages_slug_key UNIQUE (slug)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.product_categories (
    id bigint NOT NULL,
    product_id bigint,
    category_id bigint,
    CONSTRAINT product_categories_pkey PRIMARY KEY (id),
    CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE,
    CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.product_tags (
    id bigint NOT NULL,
    product_id bigint,
    tag_id bigint,
    CONSTRAINT product_tags_pkey PRIMARY KEY (id),
    CONSTRAINT product_tags_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
    CONSTRAINT product_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.products (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    description text,
    price double precision,
    stock integer,
    status text,
    featured_image_url text,
    gallery_urls text[],
    unit text,
    original_price double precision,
    slug text,
    view_count integer DEFAULT 0,
    CONSTRAINT products_pkey PRIMARY KEY (id),
    CONSTRAINT products_slug_key UNIQUE (slug)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.promos (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text,
    subtitle text,
    image_url text,
    button_text text,
    button_link text,
    status text,
    CONSTRAINT promos_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.questions (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    product_id bigint,
    user_id uuid,
    question_text text,
    answer_text text,
    status text DEFAULT 'Pending'::text,
    answered_at timestamp with time zone,
    CONSTRAINT questions_pkey PRIMARY KEY (id),
    CONSTRAINT questions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
    CONSTRAINT questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.refunds (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    order_id bigint,
    user_id uuid,
    amount numeric,
    reason text,
    status text,
    CONSTRAINT refunds_pkey PRIMARY KEY (id),
    CONSTRAINT refunds_order_id_key UNIQUE (order_id),
    CONSTRAINT refunds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    CONSTRAINT refunds_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.reviews (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    product_id bigint,
    user_id uuid,
    rating integer,
    text text,
    status text DEFAULT 'Pending'::text,
    CONSTRAINT reviews_pkey PRIMARY KEY (id),
    CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
    CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT reviews_product_id_user_id_key UNIQUE (product_id, user_id)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.settings (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    key text NOT NULL,
    value text,
    CONSTRAINT settings_pkey PRIMARY KEY (id),
    CONSTRAINT settings_key_key UNIQUE (key)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.tags (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    CONSTRAINT tags_pkey PRIMARY KEY (id),
    CONSTRAINT tags_slug_key UNIQUE (slug)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.transactions (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    order_id bigint,
    user_id uuid,
    amount numeric,
    payment_method text,
    status text,
    transaction_details jsonb,
    CONSTRAINT transactions_pkey PRIMARY KEY (id),
    CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.wishlist (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT wishlist_pkey PRIMARY KEY (id),
    CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
    CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT wishlist_user_id_product_id_key UNIQUE (user_id, product_id)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.order_history (
    id bigint NOT NULL,
    order_id bigint,
    status public.order_status,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT order_history_pkey PRIMARY KEY (id),
    CONSTRAINT order_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
) TABLESPACE pg_default;


-- ----------------------------------------------------------------
-- SEQUENCES
-- ----------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.addresses_id_seq OWNED BY public.addresses.id;
ALTER TABLE public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.cards_id_seq OWNED BY public.cards.id;
ALTER TABLE public.cards ALTER COLUMN id SET DEFAULT nextval('public.cards_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.categories_id_seq OWNED BY public.categories.id;
ALTER TABLE public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.contact_messages_id_seq OWNED BY public.contact_messages.id;
ALTER TABLE public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.home_page_sections_id_seq OWNED BY public.home_page_sections.id;
ALTER TABLE public.home_page_sections ALTER COLUMN id SET DEFAULT nextval('public.home_page_sections_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.notifications_id_seq OWNED BY public.notifications.id;
ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.offers_id_seq OWNED BY public.offers.id;
ALTER TABLE public.offers ALTER COLUMN id SET DEFAULT nextval('public.offers_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.order_items_id_seq OWNED BY public.order_items.id;
ALTER TABLE public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.orders_id_seq OWNED BY public.orders.id;
ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.pages_id_seq OWNED BY public.pages.id;
ALTER TABLE public.pages ALTER COLUMN id SET DEFAULT nextval('public.pages_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.product_categories_id_seq OWNED BY public.product_categories.id;
ALTER TABLE public.product_categories ALTER COLUMN id SET DEFAULT nextval('public.product_categories_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.product_tags_id_seq OWNED BY public.product_tags.id;
ALTER TABLE public.product_tags ALTER COLUMN id SET DEFAULT nextval('public.product_tags_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.products_id_seq OWNED BY public.products.id;
ALTER TABLE public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.promos_id_seq OWNED BY public.promos.id;
ALTER TABLE public.promos ALTER COLUMN id SET DEFAULT nextval('public.promos_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.questions_id_seq OWNED BY public.questions.id;
ALTER TABLE public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.refunds_id_seq OWNED BY public.refunds.id;
ALTER TABLE public.refunds ALTER COLUMN id SET DEFAULT nextval('public.refunds_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.reviews_id_seq OWNED BY public.reviews.id;
ALTER TABLE public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.settings_id_seq OWNED BY public.settings.id;
ALTER TABLE public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.tags_id_seq OWNED BY public.tags.id;
ALTER TABLE public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.transactions_id_seq OWNED BY public.transactions.id;
ALTER TABLE public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.wishlist_id_seq OWNED BY public.wishlist.id;
ALTER TABLE public.wishlist ALTER COLUMN id SET DEFAULT nextval('public.wishlist_id_seq'::regclass);

CREATE SEQUENCE IF NOT EXISTS public.order_history_id_seq OWNED BY public.order_history.id;
ALTER TABLE public.order_history ALTER COLUMN id SET DEFAULT nextval('public.order_history_id_seq'::regclass);


-- ----------------------------------------------------------------
-- FUNCTIONS & TRIGGERS
-- ----------------------------------------------------------------

-- Function to create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;

-- Trigger for the new user function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Function to update the `updated_at` timestamp on `pages` table
CREATE OR REPLACE FUNCTION public.set_pages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

-- Trigger for the pages updated_at function
DROP TRIGGER IF EXISTS handle_pages_updated_at ON public.pages;
CREATE TRIGGER handle_pages_updated_at
    BEFORE UPDATE ON public.pages
    FOR EACH ROW
    EXECUTE FUNCTION public.set_pages_updated_at();

-- Function to update home sections in a transactional way
CREATE OR REPLACE FUNCTION public.update_home_sections(sections_data jsonb)
RETURNS void AS $$
BEGIN
    -- First, delete all existing sections
    DELETE FROM public.home_page_sections;
    -- Then, insert the new sections from the JSON data
    INSERT INTO public.home_page_sections (category_id, display_order)
    SELECT
        (value->>'category_id')::bigint,
        (value->>'display_order')::integer
    FROM jsonb_array_elements(sections_data);
END;
$$ LANGUAGE plpgsql;

-- Function to handle toggling a wishlist item
CREATE OR REPLACE FUNCTION public.toggle_wishlist_item(p_user_id uuid, p_product_id bigint)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_status text;
BEGIN
    IF EXISTS (SELECT 1 FROM public.wishlist WHERE user_id = p_user_id AND product_id = p_product_id) THEN
        DELETE FROM public.wishlist WHERE user_id = p_user_id AND product_id = p_product_id;
        v_status := 'removed';
    ELSE
        INSERT INTO public.wishlist (user_id, product_id) VALUES (p_user_id, p_product_id);
        v_status := 'added';
    END IF;
    RETURN json_build_object('status', v_status);
END;
$$;

-- Function to get all settings as a single JSON object
CREATE OR REPLACE FUNCTION public.get_all_settings()
RETURNS TABLE (
    settings json
)
LANGUAGE sql
AS $$
    SELECT json_object_agg(key, value)
    FROM public.settings;
$$;

-- Function to log order status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.order_history (order_id, status)
    VALUES (NEW.id, NEW.status);
    RETURN NEW;
END;
$$;

-- Trigger to log order status changes
DROP TRIGGER IF EXISTS log_order_status_change_trigger ON public.orders;
CREATE TRIGGER log_order_status_change_trigger
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.log_order_status_change();

-- Trigger to log initial order status
DROP TRIGGER IF EXISTS log_initial_order_status_trigger ON public.orders;
CREATE TRIGGER log_initial_order_status_trigger
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();


-- This is a more robust function to create an order.
-- It handles transactions, item insertion, and returns the order number.
CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status public.order_status DEFAULT 'Pending'
) RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item jsonb;
BEGIN
    -- 1. Create a new order and get its ID and order_number
    INSERT INTO public.orders (
        user_id,
        total_amount,
        shipping_details,
        payment_method,
        status,
        coupon_code,
        discount_amount
    )
    VALUES (
        auth.uid(),
        p_total_amount,
        p_shipping_details,
        p_payment_method,
        p_initial_status,
        p_coupon_code,
        p_discount_amount
    )
    RETURNING id, to_char(created_at, 'YYYYMMDD') || id INTO new_order_id, new_order_number;

    -- Update the order with the generated order_number
    UPDATE public.orders SET order_number = new_order_number WHERE id = new_order_id;

    -- 2. Insert order items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            price_at_purchase
        )
        VALUES (
            new_order_id,
            (item->>'product_id')::integer,
            (item->>'quantity')::integer,
            (item->>'price')::numeric
        );
    END LOOP;

    -- 3. Create a transaction record
    IF p_payment_method != 'cod' THEN
        INSERT INTO public.transactions (
            order_id,
            user_id,
            amount,
            payment_method,
            status,
            transaction_details
        )
        VALUES (
            new_order_id,
            auth.uid(),
            p_total_amount,
            p_payment_method,
            'Completed', -- Assuming payment is successful at this stage for non-COD
            p_transaction_details
        );
    END IF;

    -- 4. Return the unique order number
    RETURN new_order_number;
END;
$$;


-- Function to update order status and log the change
CREATE OR REPLACE FUNCTION public.update_order_status_and_log(p_order_id bigint, p_new_status text)
RETURNS SETOF public.orders
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.orders
  SET status = p_new_status::public.order_status
  WHERE id = p_order_id
  RETURNING *;
END;
$$;

-- Robust function to get related products
CREATE OR REPLACE FUNCTION get_related_products(p_id integer, p_limit integer)
RETURNS TABLE(
    id integer,
    name text,
    price double precision,
    original_price double precision,
    featured_image_url text,
    unit text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    main_category_id integer;
BEGIN
    -- Get the primary category of the product
    SELECT pc.category_id INTO main_category_id FROM public.product_categories pc WHERE pc.product_id = p_id LIMIT 1;

    RETURN QUERY
    WITH scores AS (
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
            -- Score based on shared categories (2 points) and tags (1 point)
            (SELECT COUNT(*) FROM public.product_categories pc_sub WHERE pc_sub.product_id = p.id AND pc_sub.category_id IN (SELECT sub.category_id FROM public.product_categories sub WHERE sub.product_id = p_id)) * 2
            +
            (SELECT COUNT(*) FROM public.product_tags pt_sub WHERE pt_sub.product_id = p.id AND pt_sub.tag_id IN (SELECT sub.tag_id FROM public.product_tags sub WHERE sub.product_id = p_id))
        ) as relevance_score,
        -- Secondary sort criteria: are they in the same primary category?
        (EXISTS (SELECT 1 FROM public.product_categories pc_ex WHERE pc_ex.product_id = p.id AND pc_ex.category_id = main_category_id)) as in_same_category
      FROM public.products p
      WHERE p.id != p_id AND p.status = 'active'
    )
    SELECT s.id, s.name, s.price, s.original_price, s.featured_image_url, s.unit
    FROM scores s
    ORDER BY
        s.relevance_score DESC,
        s.in_same_category DESC,
        s.view_count DESC NULLS LAST,
        s.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Robust function to get recommended products, with internal fallback
CREATE OR REPLACE FUNCTION get_recommended_products(p_limit integer)
RETURNS TABLE(
    id integer,
    name text,
    price double precision,
    original_price double precision,
    featured_image_url text,
    unit text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recommended_count integer;
BEGIN
    -- First, try to get products based on the recommendation score
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
            ((SELECT COUNT(*) FROM public.order_items oi WHERE oi.product_id = p.id) * 0.5) +
            ((SELECT COUNT(*) FROM public.wishlist w WHERE w.product_id = p.id) * 0.3) +
            (COALESCE(p.view_count, 0) * 0.2) as score
        FROM
            public.products p
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
    WHERE ps.score > 0
    ORDER BY
        ps.score DESC,
        ps.created_at DESC
    LIMIT p_limit;

    -- Check if the query returned any rows
    GET DIAGNOSTICS recommended_count = ROW_COUNT;

    -- If no products were found with a score > 0, fallback to recent products
    IF recommended_count = 0 THEN
        RETURN QUERY
        SELECT
            p.id,
            p.name,
            p.price,
            p.original_price,
            p.featured_image_url,
            p.unit
        FROM
            public.products p
        WHERE p.status = 'active'
        ORDER BY
            p.created_at DESC
        LIMIT p_limit;
    END IF;
END;
$$;

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;


-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles." ON public.profiles;
CREATE POLICY "Admins can view all profiles." ON public.profiles FOR SELECT USING (get_my_role() IN ('admin', 'super-admin', 'manager'));

-- Addresses Policies
DROP POLICY IF EXISTS "Users can manage their own addresses." ON public.addresses;
CREATE POLICY "Users can manage their own addresses." ON public.addresses FOR ALL USING (auth.uid() = user_id);

-- Cards Policies
DROP POLICY IF EXISTS "Users can manage their own cards." ON public.cards;
CREATE POLICY "Users can manage their own cards." ON public.cards FOR ALL USING (auth.uid() = user_id);

-- Categories Policies
DROP POLICY IF EXISTS "Public can view categories." ON public.categories;
CREATE POLICY "Public can view categories." ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage categories." ON public.categories;
CREATE POLICY "Admins can manage categories." ON public.categories FOR ALL USING (get_my_role() IN ('admin', 'super-admin'));

-- Contact Messages Policies
DROP POLICY IF EXISTS "Admins can manage contact messages." ON public.contact_messages;
CREATE POLICY "Admins can manage contact messages." ON public.contact_messages FOR ALL USING (get_my_role() IN ('admin', 'super-admin', 'manager'));

-- Home Page Sections Policies
DROP POLICY IF EXISTS "Public can view home page sections." ON public.home_page_sections;
CREATE POLICY "Public can view home page sections." ON public.home_page_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage home page sections." ON public.home_page_sections;
CREATE POLICY "Admins can manage home page sections." ON public.home_page_sections FOR ALL USING (get_my_role() IN ('admin', 'super-admin'));

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
CREATE POLICY "Users can view their own notifications." ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can mark their own notifications as read." ON public.notifications;
CREATE POLICY "Users can mark their own notifications as read." ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view admin notifications." ON public.notifications;
CREATE POLICY "Admins can view admin notifications." ON public.notifications FOR SELECT USING (user_id IS NULL AND get_my_role() IN ('admin', 'super-admin', 'manager'));
DROP POLICY IF EXISTS "Admins can mark admin notifications as read." ON public.notifications;
CREATE POLICY "Admins can mark admin notifications as read." ON public.notifications FOR UPDATE USING (user_id IS NULL AND get_my_role() IN ('admin', 'super-admin', 'manager')) WITH CHECK (user_id IS NULL AND get_my_role() IN ('admin', 'super-admin', 'manager'));

-- Offers Policies
DROP POLICY IF EXISTS "Public can view offers." ON public.offers;
CREATE POLICY "Public can view offers." ON public.offers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage offers." ON public.offers;
CREATE POLICY "Admins can manage offers." ON public.offers FOR ALL USING (get_my_role() IN ('admin', 'super-admin'));

-- Orders Policies
DROP POLICY IF EXISTS "Users can view their own orders." ON public.orders;
CREATE POLICY "Users can view their own orders." ON public.orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all orders." ON public.orders;
CREATE POLICY "Admins can view all orders." ON public.orders FOR SELECT USING (get_my_role() IN ('admin', 'super-admin', 'manager'));
DROP POLICY IF EXISTS "Users can create orders." ON public.orders;
CREATE POLICY "Users can create orders." ON public.orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can update orders." ON public.orders;
CREATE POLICY "Admins can update orders." ON public.orders FOR UPDATE USING (get_my_role() IN ('admin', 'super-admin', 'manager'));

-- Order Items Policies
DROP POLICY IF EXISTS "Users can view their own order items." ON public.order_items;
CREATE POLICY "Users can view their own order items." ON public.order_items FOR SELECT USING (
    (SELECT user_id FROM public.orders WHERE id = order_id) = auth.uid()
);
DROP POLICY IF EXISTS "Admins can view all order items." ON public.order_items;
CREATE POLICY "Admins can view all order items." ON public.order_items FOR SELECT USING (get_my_role() IN ('admin', 'super-admin', 'manager'));

-- Order History Policies
DROP POLICY IF EXISTS "Users can view their own order history." ON public.order_history;
CREATE POLICY "Users can view their own order history." ON public.order_history FOR SELECT USING (
    (SELECT user_id FROM public.orders WHERE id = order_id) = auth.uid()
);
DROP POLICY IF EXISTS "Admins can view all order history." ON public.order_history;
CREATE POLICY "Admins can view all order history." ON public.order_history FOR SELECT USING (get_my_role() IN ('admin', 'super-admin', 'manager'));

-- Pages Policies
DROP POLICY IF EXISTS "Public can view pages." ON public.pages;
CREATE POLICY "Public can view pages." ON public.pages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage pages." ON public.pages;
CREATE POLICY "Admins can manage pages." ON public.pages FOR ALL USING (get_my_role() IN ('admin', 'super-admin'));

-- Product Related Tables Policies
DROP POLICY IF EXISTS "Public can view product associations." ON public.product_categories;
CREATE POLICY "Public can view product associations." ON public.product_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage product associations." ON public.product_categories;
CREATE POLICY "Admins can manage product associations." ON public.product_categories FOR ALL USING (get_my_role() IN ('admin', 'super-admin'));

DROP POLICY IF EXISTS "Public can view product tags." ON public.product_tags;
CREATE POLICY "Public can view product tags." ON public.product_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage product tags." ON public.product_tags;
CREATE POLICY "Admins can manage product tags." ON public.product_tags FOR ALL USING (get_my_role() IN ('admin', 'super-admin'));

-- Products Policies
DROP POLICY IF EXISTS "Public can view active products." ON public.products;
CREATE POLICY "Public can view active products." ON public.products FOR SELECT USING (status = 'active'::text);
DROP POLICY IF EXISTS "Admins can manage all products." ON public.products;
CREATE POLICY "Admins can manage all products." ON public.products FOR ALL USING (get_my_role() IN ('admin', 'super-admin'));

-- Promos Policies
DROP POLICY IF EXISTS "Public can view active promos." ON public.promos;
CREATE POLICY "Public can view active promos." ON public.promos FOR SELECT USING (status = 'active'::text);
DROP POLICY IF EXISTS "Admins can manage promos." ON public.promos;
CREATE POLICY "Admins can manage promos." ON public.promos FOR ALL USING (get_my_role() IN ('admin', 'super-admin'));

-- Questions Policies
DROP POLICY IF EXISTS "Public can view answered questions." ON public.questions;
CREATE POLICY "Public can view answered questions." ON public.questions FOR SELECT USING (status = 'Answered'::text);
DROP POLICY IF EXISTS "Authenticated users can ask questions." ON public.questions;
CREATE POLICY "Authenticated users can ask questions." ON public.questions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can manage questions." ON public.questions;
CREATE POLICY "Admins can manage questions." ON public.questions FOR ALL USING (get_my_role() IN ('admin', 'super-admin', 'manager'));

-- Refunds Policies
DROP POLICY IF EXISTS "Users can manage their own refund requests." ON public.refunds;
CREATE POLICY "Users can manage their own refund requests." ON public.refunds FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all refund requests." ON public.refunds;
CREATE POLICY "Admins can view all refund requests." ON public.refunds FOR SELECT USING (get_my_role() IN ('admin', 'super-admin', 'manager'));
DROP POLICY IF EXISTS "Admins can update refund status." ON public.refunds;
CREATE POLICY "Admins can update refund status." ON public.refunds FOR UPDATE USING (get_my_role() IN ('admin', 'super-admin', 'manager'));

-- Reviews Policies
DROP POLICY IF EXISTS "Public can view approved reviews." ON public.reviews;
CREATE POLICY "Public can view approved reviews." ON public.reviews FOR SELECT USING (status = 'Approved'::text);
DROP POLICY IF EXISTS "Authenticated users can submit reviews." ON public.reviews;
CREATE POLICY "Authenticated users can submit reviews." ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view their own reviews." ON public.reviews;
CREATE POLICY "Users can view their own reviews." ON public.reviews FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all reviews." ON public.reviews;
CREATE POLICY "Admins can manage all reviews." ON public.reviews FOR ALL USING (get_my_role() IN ('admin', 'super-admin'));

-- Settings Policies
DROP POLICY IF EXISTS "Public can view settings." ON public.settings;
CREATE POLICY "Public can view settings." ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage settings." ON public.settings;
CREATE POLICY "Admins can manage settings." ON public.settings FOR ALL USING (get_my_role() IN ('admin', 'super-admin'));

-- Tags Policies
DROP POLICY IF EXISTS "Public can view tags." ON public.tags;
CREATE POLICY "Public can view tags." ON public.tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage tags." ON public.tags;
CREATE POLICY "Admins can manage tags." ON public.tags FOR ALL USING (get_my_role() IN ('admin', 'super-admin'));

-- Transactions Policies
DROP POLICY IF EXISTS "Users can view their own transactions." ON public.transactions;
CREATE POLICY "Users can view their own transactions." ON public.transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all transactions." ON public.transactions;
CREATE POLICY "Admins can view all transactions." ON public.transactions FOR SELECT USING (get_my_role() IN ('admin', 'super-admin', 'manager'));

-- Wishlist Policies
DROP POLICY IF EXISTS "Users can manage their own wishlist." ON public.wishlist;
CREATE POLICY "Users can manage their own wishlist." ON public.wishlist FOR ALL USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- INITIAL DATA INSERTION
-- ----------------------------------------------------------------
INSERT INTO public.settings (key, value) VALUES
    ('site_title', 'Pickbazar'),
    ('site_subtitle', 'Your one-stop shop for fresh, high-quality groceries delivered to your door.'),
    ('logo_url', NULL),
    ('favicon_url', NULL),
    ('link_preview_image_url', NULL),
    ('meta_title', 'Pickbazar - Fresh Groceries Delivered'),
    ('meta_description', 'Order fresh groceries and essentials online. Fast delivery to your doorstep.'),
    ('meta_tags', 'groceries, online shopping, fresh food, delivery'),
    ('canonical_url', 'https://www.karwanbazar.com'),
    ('og_title', 'Pickbazar'),
    ('og_description', 'Fresh groceries delivered fast.'),
    ('enable_cod', 'true'),
    ('enable_mobile_banking', 'true'),
    ('enable_card_payment', 'true'),
    ('maintenance_mode', 'false'),
    ('maintenance_title', 'We''ll be back soon!'),
    ('maintenance_description', 'Sorry for the inconvenience, but we''re performing some maintenance at the moment. We''ll be back online shortly!'),
    ('maintenance_cover_image_url', NULL),
    ('maintenance_end_date', NULL),
    ('enable_promo_popup', 'true'),
    ('social_links', '[{"url": "https://facebook.com", "icon": "Facebook"}, {"url": "https://twitter.com", "icon": "Twitter"}, {"url": "https://instagram.com", "icon": "Instagram"}]'),
    ('mobile_banking_number', '01234567890'),
    ('mobile_banking_options', '["bKash", "Nagad", "Rocket"]'),
    ('shipping_cost', '5')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.pages (slug, title, content, updated_at) VALUES
    ('about', 'About Us', '{"title": "Serving You Freshness Everyday", "subtitle": "Founded with a passion for quality and a commitment to our community, Pickbazar is more than just a grocery store – it''s a promise of freshness, convenience, and value delivered right to your doorstep.", "missionTitle": "Our Mission", "missionText": "<p>Our mission is simple: to provide our customers with the freshest, highest-quality products at the best possible prices. We source locally whenever possible, supporting our community and ensuring you get the best of what''s in season. We believe that good food is the foundation of a good life, and we''re dedicated to making that accessible to everyone.</p>", "teamTitle": "Meet Our Team", "team": [{"name": "John Doe", "role": "CEO & Founder", "bio": "<p>John''s vision and passion for quality are the driving forces behind Pickbazar. With over 20 years in the grocery industry, he''s committed to revolutionizing how we shop for food.</p>"}, {"name": "Jane Smith", "role": "Head of Operations", "bio": "<p>Jane ensures that every order is packed with care and delivered on time. Her expertise in logistics is the secret to our speedy and reliable service.</p>"}, {"name": "Peter Jones", "role": "Lead Developer", "bio": "<p>Peter is the architect of our seamless online experience, constantly working to make our platform faster, smarter, and easier to use.</p>"}]}', now()),
    ('contact', 'Contact Us', '{"address": "123 Grocery Lane, Food City, 12345", "email": "support@pickbazar.com", "phone": "+1 (555) 123-4567"}', now()),
    ('faq', 'Frequently Asked Questions', '{"faqs": [{"question": "How does the delivery process work?", "answer": "We offer delivery within 90 minutes for most locations. Once you place an order, our system assigns it to the nearest delivery partner. You will receive a notification once your order is out for delivery."}, {"question": "What are the payment methods available?", "answer": "We accept all major credit and debit cards, as well as digital wallets like Apple Pay and Google Pay. Cash on Delivery (COD) is also available for select orders."}, {"question": "What is your return policy?", "answer": "We have a no-questions-asked return policy for most items within 24 hours of delivery, provided the items are in their original packaging and condition. Please check the item description for specific return information."}, {"question": "How do I track my order?", "answer": "You can track your order in real-time from the ''My Orders'' section of your account. You will also receive SMS and email updates at every stage of your order."}]}', now()),
    ('privacy-policy', 'Privacy Policy', '{"html": "<h2>1. Information We Collect</h2><p>We collect information you provide directly to us, such as when you create an account, place an order, or contact customer service.</p><h2>2. How We Use Your Information</h2><p>We use the information we collect to provide, maintain, and improve our services, including to process transactions, develop new products, and provide customer support.</p><h2>3. Sharing of Information</h2><p>We may share your information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>"}', now()),
    ('terms-and-conditions', 'Terms and Conditions', '{"html": "<h2>1. Agreement to Terms</h2><p>By using our Services, you agree to be bound by these Terms. If you don’t agree to be bound by these Terms, do not use the Services.</p><h2>2. Changes to Terms or Services</h2><p>We may update the Terms at any time, in our sole discretion. If we do so, we’ll let you know either by posting the updated Terms on the Site or through other communications.</p><h2>3. Who May Use the Services</h2><p>You may use the Services only if you are 18 years or older and are not barred from using the Services under applicable law.</p>"}', now())
ON CONFLICT (slug) DO NOTHING;

-- Add a column to track product view counts if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'view_count'
    ) THEN
        ALTER TABLE "public"."products" ADD COLUMN "view_count" integer DEFAULT 0;
    END IF;
END $$;


-- Function to increment product view count
CREATE OR REPLACE FUNCTION increment_product_view(product_id_to_inc integer)
RETURNS void AS $$
  UPDATE products
  SET view_count = view_count + 1
  WHERE id = product_id_to_inc;
$$ LANGUAGE sql;
