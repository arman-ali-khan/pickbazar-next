-- This script is designed to be idempotent, meaning it can be run multiple times without causing errors.

-- Create custom types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('customer', 'manager', 'admin', 'super-admin');
    END IF;
END
$$;

-- Create tables with "IF NOT EXISTS"
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    bio text,
    contact_number text,
    role public.user_role DEFAULT 'customer'::public.user_role,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.categories (
    id bigint NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    parent_id bigint,
    icon text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
    id bigint NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric(10,2) DEFAULT 0.00 NOT NULL,
    original_price numeric(10,2),
    stock integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    unit text,
    featured_image_url text,
    gallery_urls text[],
    view_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    rating numeric(3,2) DEFAULT 0.00 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tags (
    id bigint NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_categories (
    product_id bigint NOT NULL,
    category_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_tags (
    product_id bigint NOT NULL,
    tag_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
    id bigint NOT NULL,
    user_id uuid,
    order_number text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status public.order_status DEFAULT 'Pending'::public.order_status NOT NULL,
    shipping_details jsonb,
    payment_method text,
    payment_details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    coupon_code text,
    discount_amount numeric(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    product_id bigint NOT NULL,
    quantity integer NOT NULL,
    price_at_purchase numeric(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_history (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    status public.order_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    rating integer NOT NULL,
    text text,
    status text DEFAULT 'Pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wishlist (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.questions (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    question_text text NOT NULL,
    answer_text text,
    status text DEFAULT 'Pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    answered_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.addresses (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    address_type text,
    title text,
    country text,
    city text,
    state text,
    zip text,
    street_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cards (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    card_type text,
    last4 text,
    expiry_month integer,
    expiry_year integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id bigint NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'unread'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.home_page_sections (
    id bigint NOT NULL,
    category_id bigint NOT NULL,
    display_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.offers (
    id bigint NOT NULL,
    title text NOT NULL,
    subtitle text,
    code text NOT NULL,
    discount_percentage integer NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    status text NOT NULL,
    image_url text,
    category_ids bigint[],
    product_ids bigint[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.promos (
    id bigint NOT NULL,
    title text NOT NULL,
    subtitle text,
    button_text text,
    button_link text,
    image_url text,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.refunds (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    order_id bigint NOT NULL,
    amount numeric(10,2) NOT NULL,
    reason text NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL,
    value text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method text NOT NULL,
    status text NOT NULL,
    transaction_details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint NOT NULL,
    user_id uuid,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false NOT NULL,
    type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


-- Setup Sequences
CREATE SEQUENCE IF NOT EXISTS public.addresses_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.cards_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.categories_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.contact_messages_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.home_page_sections_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.notifications_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.offers_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.order_history_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.order_items_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.orders_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.products_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.promos_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.questions_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.refunds_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.reviews_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.tags_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.transactions_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.wishlist_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;


-- Set default values for table IDs
ALTER TABLE ONLY public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);
ALTER TABLE ONLY public.cards ALTER COLUMN id SET DEFAULT nextval('public.cards_id_seq'::regclass);
ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);
ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);
ALTER TABLE ONLY public.home_page_sections ALTER COLUMN id SET DEFAULT nextval('public.home_page_sections_id_seq'::regclass);
ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);
ALTER TABLE ONLY public.offers ALTER COLUMN id SET DEFAULT nextval('public.offers_id_seq'::regclass);
ALTER TABLE ONLY public.order_history ALTER COLUMN id SET DEFAULT nextval('public.order_history_id_seq'::regclass);
ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);
ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);
ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);
ALTER TABLE ONLY public.promos ALTER COLUMN id SET DEFAULT nextval('public.promos_id_seq'::regclass);
ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);
ALTER TABLE ONLY public.refunds ALTER COLUMN id SET DEFAULT nextval('public.refunds_id_seq'::regclass);
ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);
ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);
ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);
ALTER TABLE ONLY public.wishlist ALTER COLUMN id SET DEFAULT nextval('public.wishlist_id_seq'::regclass);

-- Add primary keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'addresses_pkey') THEN
        ALTER TABLE ONLY public.addresses ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cards_pkey') THEN
        ALTER TABLE ONLY public.cards ADD CONSTRAINT cards_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_pkey') THEN
        ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_pkey') THEN
        ALTER TABLE ONLY public.contact_messages ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'home_page_sections_pkey') THEN
        ALTER TABLE ONLY public.home_page_sections ADD CONSTRAINT home_page_sections_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_pkey') THEN
        ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offers_pkey') THEN
        ALTER TABLE ONLY public.offers ADD CONSTRAINT offers_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_history_pkey') THEN
        ALTER TABLE ONLY public.order_history ADD CONSTRAINT order_history_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_pkey') THEN
        ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_pkey') THEN
        ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_categories_pkey') THEN
        ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_pkey PRIMARY KEY (product_id, category_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_tags_pkey') THEN
        ALTER TABLE ONLY public.product_tags ADD CONSTRAINT product_tags_pkey PRIMARY KEY (product_id, tag_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_pkey') THEN
        ALTER TABLE ONLY public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promos_pkey') THEN
        ALTER TABLE ONLY public.promos ADD CONSTRAINT promos_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_pkey') THEN
        ALTER TABLE ONLY public.questions ADD CONSTRAINT questions_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refunds_pkey') THEN
        ALTER TABLE ONLY public.refunds ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_pkey') THEN
        ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_pkey') THEN
        ALTER TABLE ONLY public.settings ADD CONSTRAINT settings_pkey PRIMARY KEY (key);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_pkey') THEN
        ALTER TABLE ONLY public.tags ADD CONSTRAINT tags_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_pkey') THEN
        ALTER TABLE ONLY public.transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_pkey') THEN
        ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_pkey PRIMARY KEY (id);
    END IF;
END
$$;

-- Add foreign keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'addresses_user_id_fkey') THEN
        ALTER TABLE ONLY public.addresses ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cards_user_id_fkey') THEN
        ALTER TABLE ONLY public.cards ADD CONSTRAINT cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_parent_id_fkey') THEN
        ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'home_page_sections_category_id_fkey') THEN
        ALTER TABLE ONLY public.home_page_sections ADD CONSTRAINT home_page_sections_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN
        ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_history_order_id_fkey') THEN
        ALTER TABLE ONLY public.order_history ADD CONSTRAINT order_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_fkey') THEN
        ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_product_id_fkey') THEN
        ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey') THEN
        ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_categories_category_id_fkey') THEN
        ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_categories_product_id_fkey') THEN
        ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_tags_product_id_fkey') THEN
        ALTER TABLE ONLY public.product_tags ADD CONSTRAINT product_tags_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_tags_tag_id_fkey') THEN
        ALTER TABLE ONLY public.product_tags ADD CONSTRAINT product_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_fkey') THEN
        ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_product_id_fkey') THEN
        ALTER TABLE ONLY public.questions ADD CONSTRAINT questions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_user_id_fkey') THEN
        ALTER TABLE ONLY public.questions ADD CONSTRAINT questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refunds_order_id_fkey') THEN
        ALTER TABLE ONLY public.refunds ADD CONSTRAINT refunds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refunds_user_id_fkey') THEN
        ALTER TABLE ONLY public.refunds ADD CONSTRAINT refunds_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_product_id_fkey') THEN
        ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_user_id_fkey') THEN
        ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_order_id_fkey') THEN
        ALTER TABLE ONLY public.transactions ADD CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_product_id_fkey') THEN
        ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_user_id_fkey') THEN
        ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Add Unique Constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_slug_key') THEN
        ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_order_number_key') THEN
        ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_slug_key') THEN
        ALTER TABLE ONLY public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_slug_key') THEN
        ALTER TABLE ONLY public.tags ADD CONSTRAINT tags_slug_key UNIQUE (slug);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_user_id_product_id_key') THEN
        ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_user_id_product_id_key UNIQUE (user_id, product_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_user_id_product_id_key') THEN
        ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_user_id_product_id_key UNIQUE (user_id, product_id);
    END IF;
END
$$;

-- Create Functions using CREATE OR REPLACE
DROP FUNCTION IF EXISTS public.create_order(numeric,jsonb,jsonb,text,jsonb,text,numeric,order_status);

CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status public.order_status
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item jsonb;
BEGIN
    new_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || substr(md5(random()::text), 1, 6);

    INSERT INTO public.orders (user_id, order_number, total_amount, shipping_details, payment_method, status, coupon_code, discount_amount)
    VALUES (auth.uid(), new_order_number, p_total_amount, p_shipping_details, p_payment_method, p_initial_status, p_coupon_code, p_discount_amount)
    RETURNING id INTO new_order_id;

    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, (item->>'id')::bigint, (item->>'quantity')::integer, (item->>'price')::numeric);
    END LOOP;
    
    IF p_transaction_details IS NOT NULL THEN
        INSERT INTO public.transactions (order_id, amount, payment_method, status, transaction_details)
        VALUES (new_order_id, p_total_amount, p_payment_method, 'Completed', p_transaction_details);
    END IF;

    RETURN new_order_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT role FROM public.profiles WHERE id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.log_order_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.order_history (order_id, status)
    VALUES (NEW.id, NEW.status);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Add Trigger with DROP IF EXISTS
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_history();


-- Enable Row Level Security on all tables
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;


-- Add Policies with DROP IF EXISTS
DROP POLICY IF EXISTS "Allow public read-only access" ON public.categories;
CREATE POLICY "Allow public read-only access" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read-only access" ON public.products;
CREATE POLICY "Allow public read-only access" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read-only access" ON public.tags;
CREATE POLICY "Allow public read-only access" ON public.tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read-only access" ON public.product_categories;
CREATE POLICY "Allow public read-only access" ON public.product_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read-only access" ON public.product_tags;
CREATE POLICY "Allow public read-only access" ON public.product_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read-only access" ON public.settings;
CREATE POLICY "Allow public read-only access" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read-only access" ON public.home_page_sections;
CREATE POLICY "Allow public read-only access" ON public.home_page_sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read-only access" ON public.offers;
CREATE POLICY "Allow public read-only access" ON public.offers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read-only access" ON public.promos;
CREATE POLICY "Allow public read-only access" ON public.promos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to view their own orders" ON public.orders;
CREATE POLICY "Allow users to view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to view their own order items" ON public.order_items;
CREATE POLICY "Allow users to view their own order items" ON public.order_items FOR SELECT USING (( SELECT auth.uid() = user_id FROM public.orders WHERE id = order_id ));

DROP POLICY IF EXISTS "Allow users to view their own order history" ON public.order_history;
CREATE POLICY "Allow users to view their own order history" ON public.order_history FOR SELECT USING (( SELECT auth.uid() = user_id FROM public.orders WHERE id = order_id ));

DROP POLICY IF EXISTS "Allow users to manage their own addresses" ON public.addresses;
CREATE POLICY "Allow users to manage their own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to manage their own cards" ON public.cards;
CREATE POLICY "Allow users to manage their own cards" ON public.cards FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to manage their own questions" ON public.questions;
CREATE POLICY "Allow users to manage their own questions" ON public.questions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to manage their own reviews" ON public.reviews;
CREATE POLICY "Allow users to manage their own reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to manage their own wishlist" ON public.wishlist;
CREATE POLICY "Allow users to manage their own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to view their own notifications" ON public.notifications;
CREATE POLICY "Allow users to view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update their own notifications (is_read)" ON public.notifications;
CREATE POLICY "Allow users to update their own notifications (is_read)" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to view their own refunds" ON public.refunds;
CREATE POLICY "Allow users to view their own refunds" ON public.refunds FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own refund requests" ON public.refunds;
CREATE POLICY "Users can insert their own refund requests" ON public.refunds FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own PENDING refund requests" ON public.refunds;
CREATE POLICY "Users can delete their own PENDING refund requests" ON public.refunds FOR DELETE USING (auth.uid() = user_id AND status = 'Pending'::text);


-- Admin Policies
DROP POLICY IF EXISTS "Allow admins full access" ON public.categories;
CREATE POLICY "Allow admins full access" ON public.categories FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access" ON public.products;
CREATE POLICY "Allow admins full access" ON public.products FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access" ON public.tags;
CREATE POLICY "Allow admins full access" ON public.tags FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access" ON public.product_categories;
CREATE POLICY "Allow admins full access" ON public.product_categories FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access" ON public.product_tags;
CREATE POLICY "Allow admins full access" ON public.product_tags FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access" ON public.orders;
CREATE POLICY "Allow admins full access" ON public.orders FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access" ON public.order_items;
CREATE POLICY "Allow admins full access" ON public.order_items FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access" ON public.order_history;
CREATE POLICY "Allow admins full access" ON public.order_history FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access" ON public.settings;
CREATE POLICY "Allow admins full access" ON public.settings FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access" ON public.home_page_sections;
CREATE POLICY "Allow admins full access" ON public.home_page_sections FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access" ON public.offers;
CREATE POLICY "Allow admins full access" ON public.offers FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access" ON public.promos;
CREATE POLICY "Allow admins full access" ON public.promos FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access" ON public.contact_messages;
CREATE POLICY "Allow admins full access" ON public.contact_messages FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access" ON public.reviews;
CREATE POLICY "Allow admins full access" ON public.reviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access" ON public.questions;
CREATE POLICY "Allow admins full access" ON public.questions FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access" ON public.refunds;
CREATE POLICY "Allow admins full access" ON public.refunds FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

DROP POLICY IF EXISTS "Allow admins full access to notifications" ON public.notifications;
CREATE POLICY "Allow admins full access to notifications" ON public.notifications FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));


-- Insert sample data using ON CONFLICT to prevent errors on re-run
INSERT INTO public.categories (id, name, slug, icon, parent_id) VALUES
(1, 'Fruits & Vegetables', 'fruits-vegetables', 'Apple', NULL),
(2, 'Meat & Fish', 'meat-fish', 'Beef', NULL),
(3, 'Snacks', 'snacks', 'Cookie', NULL),
(4, 'Pet Care', 'pet-care', 'Dog', NULL),
(5, 'Home & Cleaning', 'home-cleaning', 'Home', NULL),
(6, 'Dairy', 'dairy', 'Milk', NULL),
(7, 'Cooking', 'cooking', 'Soup', NULL),
(8, 'Breakfast', 'breakfast', 'Cake', NULL),
(9, 'Beverage', 'beverage', 'GlassWater', NULL),
(10, 'Fruits', 'fruits', 'Apple', 1),
(11, 'Vegetables', 'vegetables', 'Carrot', 1),
(12, 'Meat', 'meat', 'Beef', 2),
(13, 'Fish', 'fish', 'Fish', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tags (id, name, slug) VALUES
(1, 'Fresh', 'fresh'),
(2, 'Organic', 'organic'),
(3, 'Healthy', 'healthy'),
(4, 'Sale', 'sale')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, original_price, stock, status, unit, featured_image_url, gallery_urls) VALUES
(1, 'Apples', 'apples', 'An apple is a sweet, edible fruit produced by an apple tree...', 1.60, 2.00, 18, 'active', '1lb', 'https://images.unsplash.com/photo-1439127989242-c3749a012eac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxyZWQlMjBhcHBsZXN8ZW58MHx8fHwxNzY4ODg3MzQxfDA&ixlib=rb-4.1.0&q=80&w=1080', '{"https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxyZWQlMjBhcHBsZXxlbnwwfHx8fDE3Njg4NTMxMjN8MA&ixlib=rb-4.1.0&q=80&w=1080", "https://images.unsplash.com/photo-1590005354167-6da97870c757?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxhcHBsZSUyMHNsaWNlfGVufDB8fHx8MTc2ODkwMDg2NHww&ixlib=rb-4.1.0&q=80&w=1080"}'),
(2, 'Baby Spinach', 'baby-spinach', 'Fresh baby spinach leaves, perfect for salads.', 0.60, NULL, 50, 'active', '2lb', 'https://images.unsplash.com/photo-1598278242809-6c21ee17aef1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxzcGluYWNofGVufDB8fHx8MTc2ODk3ODI1N3ww&ixlib=rb-4.1.0&q=80&w=1080', '{}'),
(3, 'Blueberries', 'blueberries', 'Sweet and juicy blueberries, packed with antioxidants.', 3.00, NULL, 30, 'active', '1lb', 'https://images.unsplash.com/photo-1606757389667-45c2024f9fa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxibHVlYmVycmllc3xlbnwwfHx8fDE3Njg5MDQ2ODR8MA&ixlib=rb-4.1.0&q=80&w=1080', '{}'),
(4, 'Brussels Sprout', 'brussels-sprout', 'Fresh Brussels sprouts, great for roasting.', 3.69, 4.50, 25, 'active', '1lb', 'https://images.unsplash.com/photo-1670843840538-9fe8d95b59f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxicnVzc2VscyUyMHNwcm91dHxlbnwwfHx8fDE3Njg5MDA4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080', '{}'),
(5, 'Clementines', 'clementines', 'Sweet, juicy, and easy to peel clementines.', 2.50, 2.75, 40, 'active', '1lb', 'https://images.unsplash.com/photo-1706773183787-c03c3eb709f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxjbGVtZW50aW5lc3xlbnwwfHx8fDE3Njg5MDA4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080', '{}'),
(6, 'Sweet Corn', 'sweet-corn', 'Fresh and sweet corn on the cob.', 1.80, NULL, 60, 'active', '1lb', 'https://images.unsplash.com/photo-1675501342249-bdaaeb27c5cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxzd2VldCUyMGNvcm58ZW58MHx8fHwxNzY4OTAwODY0fDA&ixlib=rb-4.1.0&q=80&w=1080', '{}'),
(7, 'Cucumber', 'cucumber', 'Crisp and refreshing cucumber.', 0.75, NULL, 100, 'active', '1pc', 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxjdWN1bWJlcnxlbnwwfHx8fDE3Njg5MDA4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080', '{}'),
(8, 'Dates', 'dates', 'Sweet and chewy dates, a healthy snack.', 4.50, NULL, 20, 'active', '250g', 'https://images.unsplash.com/photo-1649335889120-4084d7456c7c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxkYXRlc3xlbnwwfHx8fDE3Njg5MDA4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080', '{}'),
(9, 'French Green Beans', 'french-green-beans', 'Tender and flavorful French green beans.', 2.20, NULL, 35, 'active', '1lb', 'https://images.unsplash.com/photo-1574963835594-61eede2070dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxncmVlbiUyMGJlYW5zfGVufDB8fHx8MTc2ODkwMDg2NHww&ixlib=rb-4.1.0&q=80&w=1080', '{}'),
(10, 'Radish', 'radish', 'Crisp and peppery radishes.', 2.11, 2.59, 45, 'active', '1lbs', 'https://images.unsplash.com/photo-1687199129802-3e4cc27baac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxmcmVzaCUyMHJhZGlzaGVzfGVufDB8fHx8MTc2ODk3ODI1OHww&ixlib=rb-4.1.0&q=80&w=1080', '{}'),
(11, 'Wegman''s Carrots', 'wegmans-carrots', 'Sweet and crunchy carrots.', 2.10, NULL, 70, 'active', '1lbs', 'https://images.unsplash.com/photo-1741518359356-623aa8385826?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxmcmVzaCUyMGNhcnJvdHN8ZW58MHx8fHwxNzY4OTExMDI2fDA&ixlib=rb-4.1.0&q=80&w=1080', '{}'),
(12, 'White Radish', 'white-radish', 'Mild and crisp white radish, also known as daikon.', 2.99, NULL, 30, 'active', '1lbs', 'https://images.unsplash.com/photo-1593629718347-283811841101?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHx3aGl0ZSUyMHJhZGlzaHxlbnwwfHx8fDE3Njg5NzgyNTh8MA&ixlib=rb-4.1.0&q=80&w=1080', '{}'),
(13, 'Baby Radish', 'baby-radish', 'Small and tender baby radishes.', 1.00, NULL, 50, 'active', '1lbs', 'https://images.unsplash.com/photo-1528826234716-96aaa8e9a413?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxiYWJ5JTIwdHVybmlwfGVufDB8fHx8MTc2ODk3ODI1OHww&ixlib=rb-4.1.0&q=80&w=1080', '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_categories (product_id, category_id) VALUES
(1, 10), (2, 11), (3, 10), (4, 11), (5, 10), (6, 11), (7, 11), (8, 10), (9, 11), (10, 11), (11, 11), (12, 11), (13, 11)
ON CONFLICT (product_id, category_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id) VALUES
(1, 1), (1, 3), (2, 1), (2, 2), (3, 1), (4, 4)
ON CONFLICT (product_id, tag_id) DO NOTHING;

-- Update sequence values to avoid conflicts with inserted data
SELECT setval('public.categories_id_seq', (SELECT MAX(id) FROM public.categories));
SELECT setval('public.products_id_seq', (SELECT MAX(id) FROM public.products));
SELECT setval('public.tags_id_seq', (SELECT MAX(id) FROM public.tags));


-- Resetting the profiles table policy (This is safe to run multiple times)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super-admin'));

