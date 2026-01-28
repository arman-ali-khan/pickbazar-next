-- This script is designed to be idempotent and can be run multiple times safely.

-- Drop the old, problematic function signatures if they exist.
DROP FUNCTION IF EXISTS public.create_order(numeric,jsonb,jsonb,text,jsonb,text,numeric,text);
DROP FUNCTION IF EXISTS public.create_order(numeric,jsonb,jsonb,text,jsonb,text,numeric);

-- Create custom types if they don't exist
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
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE public.notification_type AS ENUM (
            'new_order',
            'new_review',
            'new_question',
            'question_answered',
            'new_message',
            'order_update',
            'refund_update',
            'new_refund',
            'role_update',
            'promotion',
            'security'
        );
    END IF;
END
$$;

-- Tables creation
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    bio text,
    contact_number text,
    role text DEFAULT 'customer'::text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id bigint NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    parent_id bigint,
    icon text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS public.categories_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'categories_pkey' AND conrelid = 'public.categories'::regclass
    ) THEN
        ALTER TABLE public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'categories_slug_key' AND conrelid = 'public.categories'::regclass
    ) THEN
        ALTER TABLE public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
    END IF;
     IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'categories_parent_id_fkey' AND conrelid = 'public.categories'::regclass
    ) THEN
        ALTER TABLE public.categories ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.tags (
    id bigint NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.tags_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_pkey' AND conrelid = 'public.tags'::regclass) THEN
        ALTER TABLE public.tags ADD CONSTRAINT tags_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_name_key' AND conrelid = 'public.tags'::regclass) THEN
        ALTER TABLE public.tags ADD CONSTRAINT tags_name_key UNIQUE (name);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_slug_key' AND conrelid = 'public.tags'::regclass) THEN
        ALTER TABLE public.tags ADD CONSTRAINT tags_slug_key UNIQUE (slug);
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.products (
    id bigint NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    original_price numeric(10,2),
    stock integer DEFAULT 0,
    unit text,
    status text DEFAULT 'draft'::text NOT NULL,
    featured_image_url text,
    gallery_urls text[],
    view_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.products_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_pkey' AND conrelid = 'public.products'::regclass) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_slug_key' AND conrelid = 'public.products'::regclass) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.product_categories (
    product_id bigint NOT NULL,
    category_id bigint NOT NULL
);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_categories_pkey' AND conrelid = 'public.product_categories'::regclass) THEN
        ALTER TABLE public.product_categories ADD CONSTRAINT product_categories_pkey PRIMARY KEY (product_id, category_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_categories_product_id_fkey' AND conrelid = 'public.product_categories'::regclass) THEN
        ALTER TABLE public.product_categories ADD CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_categories_category_id_fkey' AND conrelid = 'public.product_categories'::regclass) THEN
        ALTER TABLE public.product_categories ADD CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.product_tags (
    product_id bigint NOT NULL,
    tag_id bigint NOT NULL
);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_tags_pkey' AND conrelid = 'public.product_tags'::regclass) THEN
        ALTER TABLE public.product_tags ADD CONSTRAINT product_tags_pkey PRIMARY KEY (product_id, tag_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_tags_product_id_fkey' AND conrelid = 'public.product_tags'::regclass) THEN
        ALTER TABLE public.product_tags ADD CONSTRAINT product_tags_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_tags_tag_id_fkey' AND conrelid = 'public.product_tags'::regclass) THEN
        ALTER TABLE public.product_tags ADD CONSTRAINT product_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.orders (
    id bigint NOT NULL,
    user_id uuid,
    order_number text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status public.order_status DEFAULT 'Pending'::public.order_status,
    shipping_details jsonb,
    payment_details jsonb,
    coupon_code text,
    discount_amount numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.orders_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_pkey' AND conrelid = 'public.orders'::regclass) THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_order_number_key' AND conrelid = 'public.orders'::regclass) THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey' AND conrelid = 'public.orders'::regclass) THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    product_id bigint,
    quantity integer NOT NULL,
    price_at_purchase numeric(10,2) NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS public.order_items_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_pkey' AND conrelid = 'public.order_items'::regclass) THEN
        ALTER TABLE public.order_items ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_fkey' AND conrelid = 'public.order_items'::regclass) THEN
        ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_product_id_fkey' AND conrelid = 'public.order_items'::regclass) THEN
        ALTER TABLE public.order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.transactions (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    user_id uuid,
    amount numeric(10,2) NOT NULL,
    payment_method text NOT NULL,
    status text DEFAULT 'Completed'::text,
    transaction_details jsonb,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.transactions_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_pkey' AND conrelid = 'public.transactions'::regclass) THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_order_id_fkey' AND conrelid = 'public.transactions'::regclass) THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_user_id_fkey' AND conrelid = 'public.transactions'::regclass) THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.reviews (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    rating integer NOT NULL,
    text text,
    status text DEFAULT 'Pending'::text,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.reviews_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_pkey' AND conrelid = 'public.reviews'::regclass) THEN
        ALTER TABLE public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_user_id_product_id_key' AND conrelid = 'public.reviews'::regclass) THEN
        ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_product_id_key UNIQUE (user_id, product_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_user_id_fkey' AND conrelid = 'public.reviews'::regclass) THEN
        ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_product_id_fkey' AND conrelid = 'public.reviews'::regclass) THEN
        ALTER TABLE public.reviews ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.questions (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    question_text text NOT NULL,
    answer_text text,
    status text DEFAULT 'Pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    answered_at timestamp with time zone
);
CREATE SEQUENCE IF NOT EXISTS public.questions_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_pkey' AND conrelid = 'public.questions'::regclass) THEN
        ALTER TABLE public.questions ADD CONSTRAINT questions_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_user_id_fkey' AND conrelid = 'public.questions'::regclass) THEN
        ALTER TABLE public.questions ADD CONSTRAINT questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_product_id_fkey' AND conrelid = 'public.questions'::regclass) THEN
        ALTER TABLE public.questions ADD CONSTRAINT questions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.wishlist (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.wishlist_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.wishlist ALTER COLUMN id SET DEFAULT nextval('public.wishlist_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_pkey' AND conrelid = 'public.wishlist'::regclass) THEN
        ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_user_id_product_id_key' AND conrelid = 'public.wishlist'::regclass) THEN
        ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_user_id_product_id_key UNIQUE (user_id, product_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_user_id_fkey' AND conrelid = 'public.wishlist'::regclass) THEN
        ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_product_id_fkey' AND conrelid = 'public.wishlist'::regclass) THEN
        ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END
$$;


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
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.addresses_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'addresses_pkey' AND conrelid = 'public.addresses'::regclass) THEN
        ALTER TABLE public.addresses ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'addresses_user_id_fkey' AND conrelid = 'public.addresses'::regclass) THEN
        ALTER TABLE public.addresses ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.cards (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    card_type text,
    last4 text,
    expiry_month integer,
    expiry_year integer,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.cards_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.cards ALTER COLUMN id SET DEFAULT nextval('public.cards_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cards_pkey' AND conrelid = 'public.cards'::regclass) THEN
        ALTER TABLE public.cards ADD CONSTRAINT cards_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cards_user_id_fkey' AND conrelid = 'public.cards'::regclass) THEN
        ALTER TABLE public.cards ADD CONSTRAINT cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint NOT NULL,
    user_id uuid,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    type public.notification_type
);
CREATE SEQUENCE IF NOT EXISTS public.notifications_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_pkey' AND conrelid = 'public.notifications'::regclass) THEN
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey' AND conrelid = 'public.notifications'::regclass) THEN
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL,
    value text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_pkey' AND conrelid = 'public.settings'::regclass) THEN
        ALTER TABLE public.settings ADD CONSTRAINT settings_pkey PRIMARY KEY (key);
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.pages (
    id bigint NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    content jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.pages_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.pages ALTER COLUMN id SET DEFAULT nextval('public.pages_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_pkey' AND conrelid = 'public.pages'::regclass) THEN
        ALTER TABLE public.pages ADD CONSTRAINT pages_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_slug_key' AND conrelid = 'public.pages'::regclass) THEN
        ALTER TABLE public.pages ADD CONSTRAINT pages_slug_key UNIQUE (slug);
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.contact_messages (
    id bigint NOT NULL,
    name text,
    email text,
    subject text,
    message text,
    status text DEFAULT 'unread'::text,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.contact_messages_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_pkey' AND conrelid = 'public.contact_messages'::regclass) THEN
        ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.refunds (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'Pending'::text,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.refunds_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.refunds ALTER COLUMN id SET DEFAULT nextval('public.refunds_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refunds_pkey' AND conrelid = 'public.refunds'::regclass) THEN
        ALTER TABLE public.refunds ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refunds_order_id_fkey' AND conrelid = 'public.refunds'::regclass) THEN
        ALTER TABLE public.refunds ADD CONSTRAINT refunds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refunds_user_id_fkey' AND conrelid = 'public.refunds'::regclass) THEN
        ALTER TABLE public.refunds ADD CONSTRAINT refunds_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.offers (
    id bigint NOT NULL,
    title text NOT NULL,
    subtitle text,
    code text NOT NULL,
    discount_percentage numeric(5,2) NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    image_url text,
    category_ids integer[],
    product_ids integer[],
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.offers_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.offers ALTER COLUMN id SET DEFAULT nextval('public.offers_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offers_pkey' AND conrelid = 'public.offers'::regclass) THEN
        ALTER TABLE public.offers ADD CONSTRAINT offers_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offers_code_key' AND conrelid = 'public.offers'::regclass) THEN
        ALTER TABLE public.offers ADD CONSTRAINT offers_code_key UNIQUE (code);
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.home_page_sections (
    id bigint NOT NULL,
    category_id bigint NOT NULL,
    display_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.home_page_sections_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.home_page_sections ALTER COLUMN id SET DEFAULT nextval('public.home_page_sections_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'home_page_sections_pkey' AND conrelid = 'public.home_page_sections'::regclass) THEN
        ALTER TABLE public.home_page_sections ADD CONSTRAINT home_page_sections_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'home_page_sections_category_id_key' AND conrelid = 'public.home_page_sections'::regclass) THEN
        ALTER TABLE public.home_page_sections ADD CONSTRAINT home_page_sections_category_id_key UNIQUE (category_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'home_page_sections_category_id_fkey' AND conrelid = 'public.home_page_sections'::regclass) THEN
        ALTER TABLE public.home_page_sections ADD CONSTRAINT home_page_sections_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.promos (
    id bigint NOT NULL,
    title text NOT NULL,
    subtitle text,
    button_text text,
    button_link text,
    image_url text,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.promos_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.promos ALTER COLUMN id SET DEFAULT nextval('public.promos_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promos_pkey' AND conrelid = 'public.promos'::regclass) THEN
        ALTER TABLE public.promos ADD CONSTRAINT promos_pkey PRIMARY KEY (id);
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.order_history (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    status public.order_status NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.order_history_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.order_history ALTER COLUMN id SET DEFAULT nextval('public.order_history_id_seq'::regclass);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_history_pkey' AND conrelid = 'public.order_history'::regclass) THEN
        ALTER TABLE public.order_history ADD CONSTRAINT order_history_pkey PRIMARY KEY (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_history_order_id_fkey' AND conrelid = 'public.order_history'::regclass) THEN
        ALTER TABLE public.order_history ADD CONSTRAINT order_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Functions

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
    item record;
    current_user_id uuid;
BEGIN
    -- Use the session user's ID
    current_user_id := auth.uid();
    
    -- Generate a unique order number using the sequence
    new_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || nextval('public.orders_id_seq');

    -- Insert the order
    INSERT INTO public.orders (user_id, order_number, total_amount, shipping_details, coupon_code, discount_amount, status)
    VALUES (current_user_id, new_order_number, p_total_amount, p_shipping_details, p_coupon_code, p_discount_amount, p_initial_status)
    RETURNING id INTO new_order_id;

    -- Insert order items
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id int, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, item.product_id, item.quantity, item.price);
        
        -- Decrement stock
        UPDATE public.products
        SET stock = stock - item.quantity
        WHERE id = item.product_id;
    END LOOP;

    -- Insert transaction record
    INSERT INTO public.transactions (order_id, user_id, amount, payment_method, transaction_details, status)
    VALUES (new_order_id, current_user_id, p_total_amount, p_payment_method, p_transaction_details, 'Completed');
    
    RETURN new_order_number;
END;
$$;


CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.order_history (order_id, status)
    VALUES (NEW.id, NEW.status);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Triggers
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();


-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

-- Policies
-- Drop existing policies before creating new ones to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view public tables" ON public.categories;
CREATE POLICY "Anyone can view public tables" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view public tables" ON public.tags;
CREATE POLICY "Anyone can view public tables" ON public.tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view public tables" ON public.products;
CREATE POLICY "Anyone can view public tables" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view public tables" ON public.product_categories;
CREATE POLICY "Anyone can view public tables" ON public.product_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view public tables" ON public.product_tags;
CREATE POLICY "Anyone can view public tables" ON public.product_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view public tables" ON public.settings;
CREATE POLICY "Anyone can view public tables" ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view public tables" ON public.pages;
CREATE POLICY "Anyone can view public tables" ON public.pages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view public tables" ON public.offers;
CREATE POLICY "Anyone can view public tables" ON public.offers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view public tables" ON public.home_page_sections;
CREATE POLICY "Anyone can view public tables" ON public.home_page_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view public tables" ON public.promos;
CREATE POLICY "Anyone can view public tables" ON public.promos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their own orders." ON public.orders;
CREATE POLICY "Users can view their own orders." ON public.orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create orders." ON public.orders;
CREATE POLICY "Users can create orders." ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own order items." ON public.order_items;
CREATE POLICY "Users can view their own order items." ON public.order_items FOR SELECT USING ((SELECT auth.uid() FROM public.orders WHERE id = order_id) = auth.uid());

DROP POLICY IF EXISTS "Users can view their own transactions." ON public.transactions;
CREATE POLICY "Users can view their own transactions." ON public.transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Reviews are public." ON public.reviews;
CREATE POLICY "Reviews are public." ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own reviews." ON public.reviews;
CREATE POLICY "Users can insert their own reviews." ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own reviews." ON public.reviews;
CREATE POLICY "Users can delete their own reviews." ON public.reviews FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Questions are public." ON public.questions;
CREATE POLICY "Questions are public." ON public.questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can ask questions." ON public.questions;
CREATE POLICY "Users can ask questions." ON public.questions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own wishlist." ON public.wishlist;
CREATE POLICY "Users can manage their own wishlist." ON public.wishlist FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own addresses." ON public.addresses;
CREATE POLICY "Users can manage their own addresses." ON public.addresses FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own cards." ON public.cards;
CREATE POLICY "Users can manage their own cards." ON public.cards FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
CREATE POLICY "Users can view their own notifications." ON public.notifications FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own notifications." ON public.notifications;
CREATE POLICY "Users can update their own notifications." ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can send a message." ON public.contact_messages;
CREATE POLICY "Anyone can send a message." ON public.contact_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can manage their own refund requests." ON public.refunds;
CREATE POLICY "Users can manage their own refund requests." ON public.refunds FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin full access" ON public.categories;
CREATE POLICY "Admin full access" ON public.categories FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.tags;
CREATE POLICY "Admin full access" ON public.tags FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.products;
CREATE POLICY "Admin full access" ON public.products FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.product_categories;
CREATE POLICY "Admin full access" ON public.product_categories FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.product_tags;
CREATE POLICY "Admin full access" ON public.product_tags FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.orders;
CREATE POLICY "Admin full access" ON public.orders FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.order_items;
CREATE POLICY "Admin full access" ON public.order_items FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.transactions;
CREATE POLICY "Admin full access" ON public.transactions FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.reviews;
CREATE POLICY "Admin full access" ON public.reviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.questions;
CREATE POLICY "Admin full access" ON public.questions FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.settings;
CREATE POLICY "Admin full access" ON public.settings FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.pages;
CREATE POLICY "Admin full access" ON public.pages FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.contact_messages;
CREATE POLICY "Admin full access" ON public.contact_messages FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.refunds;
CREATE POLICY "Admin full access" ON public.refunds FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.offers;
CREATE POLICY "Admin full access" ON public.offers FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.home_page_sections;
CREATE POLICY "Admin full access" ON public.home_page_sections FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.promos;
CREATE POLICY "Admin full access" ON public.promos FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));
DROP POLICY IF EXISTS "Admin full access" ON public.order_history;
CREATE POLICY "Admin full access" ON public.order_history FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'super-admin'));

-- Grant usage on sequences
GRANT USAGE, SELECT ON SEQUENCE public.categories_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.tags_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.products_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.orders_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.order_items_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.transactions_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.reviews_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.questions_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.wishlist_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.addresses_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.cards_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.notifications_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.pages_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.contact_messages_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.refunds_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.offers_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.home_page_sections_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.promos_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.order_history_id_seq TO anon, authenticated;
