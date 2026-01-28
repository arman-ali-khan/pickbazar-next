
-- Drop existing types and functions to avoid conflicts
DO $$
BEGIN
   IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
      DROP TYPE public.order_status;
   END IF;
   IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
      DROP TYPE public.user_role;
   END IF;
   IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
      DROP TYPE public.notification_type;
   END IF;
END$$;

DROP FUNCTION IF EXISTS public.create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric);
DROP FUNCTION IF EXISTS public.create_order(numeric,jsonb,jsonb,text,jsonb,text,numeric,order_status);
DROP FUNCTION IF EXISTS public.get_admin_order_list();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.log_order_status_change();
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;

-- Create ENUM types
CREATE TYPE public.order_status AS ENUM (
    'Pending',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Failed'
);

CREATE TYPE public.user_role AS ENUM (
    'customer',
    'manager',
    'admin',
    'super-admin'
);

CREATE TYPE public.notification_type AS ENUM (
    'new_order',
    'order_update',
    'new_review',
    'new_question',
    'question_answered',
    'new_refund',
    'refund_update',
    'new_message',
    'role_update',
    'promotion',
    'security'
);


-- Create Tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    bio text,
    contact_number text,
    role user_role DEFAULT 'customer'::user_role,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
    id bigint NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    original_price numeric(10,2),
    stock integer DEFAULT 0,
    status text DEFAULT 'draft'::text,
    featured_image_url text,
    gallery_urls text[],
    unit text,
    created_at timestamp with time zone DEFAULT now(),
    view_count integer DEFAULT 0,
    slug text NOT NULL
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

CREATE TABLE IF NOT EXISTS public.tags (
    id bigint NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
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
    status order_status DEFAULT 'Pending'::order_status,
    shipping_details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    coupon_code text,
    discount_amount numeric(10,2),
    payment_details jsonb
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint NOT NULL,
    order_id bigint,
    product_id bigint,
    quantity integer,
    price_at_purchase numeric(10,2)
);

CREATE TABLE IF NOT EXISTS public.wishlist (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    rating integer NOT NULL,
    text text,
    status text DEFAULT 'Pending'::text,
    created_at timestamp with time zone DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL,
    value text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.addresses (
    id bigint NOT NULL,
    user_id uuid,
    address_type text,
    title text,
    country text,
    city text,
    state text,
    zip text,
    street_address text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cards (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    card_type text,
    last4 text,
    expiry_month integer,
    expiry_year integer,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id bigint NOT NULL,
    name text,
    email text,
    subject text,
    message text,
    status text DEFAULT 'unread'::text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.home_page_sections (
    id bigint NOT NULL,
    category_id bigint NOT NULL,
    display_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offers (
    id bigint NOT NULL,
    title text NOT NULL,
    subtitle text,
    code text NOT NULL,
    discount_percentage numeric(5,2) NOT NULL,
    status text DEFAULT 'inactive'::text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    image_url text,
    category_ids bigint[],
    product_ids bigint[],
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pages (
    id bigint NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    content jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promos (
    id bigint NOT NULL,
    title text NOT NULL,
    subtitle text,
    button_text text,
    button_link text,
    image_url text,
    status text DEFAULT 'inactive'::text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.refunds (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    order_id bigint NOT NULL,
    amount numeric(10,2) NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'Pending'::text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method text NOT NULL,
    status text NOT NULL,
    transaction_details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint NOT NULL,
    user_id uuid,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    type notification_type
);

CREATE TABLE IF NOT EXISTS public.order_history (
    id bigint generated by default as identity,
    order_id bigint not null,
    status public.order_status not null,
    created_at timestamp with time zone not null default now(),
    constraint order_history_pkey primary key (id),
    constraint order_history_order_id_fkey foreign key (order_id) references orders (id) on delete cascade
) tablespace pg_default;


-- Sequences
CREATE SEQUENCE IF NOT EXISTS public.addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.addresses_id_seq OWNED BY public.addresses.id;

CREATE SEQUENCE IF NOT EXISTS public.cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.cards_id_seq OWNED BY public.cards.id;

CREATE SEQUENCE IF NOT EXISTS public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;

CREATE SEQUENCE IF NOT EXISTS public.contact_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.contact_messages_id_seq OWNED BY public.contact_messages.id;

CREATE SEQUENCE IF NOT EXISTS public.home_page_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.home_page_sections_id_seq OWNED BY public.home_page_sections.id;

CREATE SEQUENCE IF NOT EXISTS public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;

CREATE SEQUENCE IF NOT EXISTS public.offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.offers_id_seq OWNED BY public.offers.id;

CREATE SEQUENCE IF NOT EXISTS public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;

CREATE SEQUENCE IF NOT EXISTS public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;

CREATE SEQUENCE IF NOT EXISTS public.pages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.pages_id_seq OWNED BY public.pages.id;

CREATE SEQUENCE IF NOT EXISTS public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;

CREATE SEQUENCE IF NOT EXISTS public.promos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.promos_id_seq OWNED BY public.promos.id;

CREATE SEQUENCE IF NOT EXISTS public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;

CREATE SEQUENCE IF NOT EXISTS public.refunds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.refunds_id_seq OWNED BY public.refunds.id;

CREATE SEQUENCE IF NOT EXISTS public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;

CREATE SEQUENCE IF NOT EXISTS public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;

CREATE SEQUENCE IF NOT EXISTS public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;

CREATE SEQUENCE IF NOT EXISTS public.wishlist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.wishlist_id_seq OWNED BY public.wishlist.id;


-- Set default values for ID columns
ALTER TABLE ONLY public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);
ALTER TABLE ONLY public.cards ALTER COLUMN id SET DEFAULT nextval('public.cards_id_seq'::regclass);
ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);
ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);
ALTER TABLE ONLY public.home_page_sections ALTER COLUMN id SET DEFAULT nextval('public.home_page_sections_id_seq'::regclass);
ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);
ALTER TABLE ONLY public.offers ALTER COLUMN id SET DEFAULT nextval('public.offers_id_seq'::regclass);
ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);
ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);
ALTER TABLE ONLY public.pages ALTER COLUMN id SET DEFAULT nextval('public.pages_id_seq'::regclass);
ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);
ALTER TABLE ONLY public.promos ALTER COLUMN id SET DEFAULT nextval('public.promos_id_seq'::regclass);
ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);
ALTER TABLE ONLY public.refunds ALTER COLUMN id SET DEFAULT nextval('public.refunds_id_seq'::regclass);
ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);
ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);
ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);
ALTER TABLE ONLY public.wishlist ALTER COLUMN id SET DEFAULT nextval('public.wishlist_id_seq'::regclass);

-- Primary Keys
ALTER TABLE ONLY public.addresses ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cards ADD CONSTRAINT cards_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.contact_messages ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.home_page_sections ADD CONSTRAINT home_page_sections_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.offers ADD CONSTRAINT offers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.pages ADD CONSTRAINT pages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_pkey PRIMARY KEY (product_id, category_id);
ALTER TABLE ONLY public.product_tags ADD CONSTRAINT product_tags_pkey PRIMARY KEY (product_id, tag_id);
ALTER TABLE ONLY public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.promos ADD CONSTRAINT promos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.questions ADD CONSTRAINT questions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.refunds ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.settings ADD CONSTRAINT settings_pkey PRIMARY KEY (key);
ALTER TABLE ONLY public.tags ADD CONSTRAINT tags_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

-- Unique Constraints
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.offers ADD CONSTRAINT offers_code_key UNIQUE (code);
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);
ALTER TABLE ONLY public.pages ADD CONSTRAINT pages_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_user_id_product_id_key UNIQUE (user_id, product_id);
ALTER TABLE ONLY public.tags ADD CONSTRAINT tags_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_user_id_product_id_key UNIQUE (user_id, product_id);

-- Foreign Keys
ALTER TABLE ONLY public.addresses ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cards ADD CONSTRAINT cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.home_page_sections ADD CONSTRAINT home_page_sections_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_tags ADD CONSTRAINT product_tags_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_tags ADD CONSTRAINT product_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.questions ADD CONSTRAINT questions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.questions ADD CONSTRAINT questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.refunds ADD CONSTRAINT refunds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.refunds ADD CONSTRAINT refunds_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.transactions ADD CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Insert Data
INSERT INTO public.categories (id, name, slug, description, parent_id, icon) OVERRIDING SYSTEM VALUE VALUES
(1, 'Fruits & Vegetables', 'fruits-vegetables', NULL, NULL, 'Apple'),
(2, 'Meat & Fish', 'meat-fish', NULL, NULL, 'Beef'),
(3, 'Snacks', 'snacks', NULL, NULL, 'Cookie'),
(4, 'Pet Care', 'pet-care', NULL, NULL, 'Dog'),
(5, 'Home & Cleaning', 'home-cleaning', NULL, NULL, 'Home'),
(6, 'Dairy', 'dairy', NULL, NULL, 'Milk'),
(7, 'Cooking', 'cooking', NULL, NULL, 'Soup'),
(8, 'Breakfast', 'breakfast', NULL, NULL, 'Cake'),
(9, 'Beverage', 'beverage', NULL, NULL, 'GlassWater'),
(10, 'Beauty & Health', 'beauty-health', NULL, NULL, 'Sparkles'),
(11, 'Fruits', 'fruits', NULL, 1, 'Grape'),
(12, 'Vegetables', 'vegetables', NULL, 1, 'Carrot'),
(13, 'Meat', 'meat', NULL, 2, 'Beef'),
(14, 'Fish', 'fish', NULL, 2, 'Fish');

INSERT INTO public.tags (id, name, slug) OVERRIDING SYSTEM VALUE VALUES
(1, 'fresh', 'fresh'),
(2, 'organic', 'organic'),
(3, 'sale', 'sale'),
(4, 'new', 'new');

INSERT INTO public.products (id, name, description, price, original_price, stock, status, featured_image_url, gallery_urls, unit, slug) OVERRIDING SYSTEM VALUE VALUES
(1, 'Apples', 'An apple is a sweet, edible fruit produced by an apple tree...', 1.60, 2.00, 50, 'active', 'https://images.unsplash.com/photo-1439127989242-c3749a012eac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxyZWQlMjBhcHBsZXN8ZW58MHx8fHwxNzY4ODg3MzQxfDA&ixlib=rb-4.1.0&q=80&w=1080', '{https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxyZWQlMjBhcHBsZXxlbnwwfHx8fDE3Njg4NTMxMjN8MA&ixlib=rb-4.1.0&q=80&w=1080,https://images.unsplash.com/photo-1590005354167-6da97870c757?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxhcHBsZSUyMHNsaWNlfGVufDB8fHx8MTc2ODkwMDg2NHww&ixlib=rb-4.1.0&q=80&w=1080}', '1lb', 'apples'),
(2, 'Baby Spinach', 'Tender and mild baby spinach leaves, perfect for salads.', 0.60, NULL, 30, 'active', 'https://images.unsplash.com/photo-1598278242809-6c21ee17aef1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxzcGluYWNofGVufDB8fHx8MTc2ODk3ODI1N3ww&ixlib=rb-4.1.0&q=80&w=1080', '{}', '2lb', 'baby-spinach'),
(3, 'Blueberries', 'Sweet and juicy blueberries, packed with antioxidants.', 3.00, NULL, 40, 'active', 'https://images.unsplash.com/photo-1606757389667-45c2024f9fa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxibHVlYmVycmllc3xlbnwwfHx8fDE3Njg5MDQ2ODR8MA&ixlib=rb-4.1.0&q=80&w=1080', '{}', '1lb', 'blueberries'),
(4, 'Brussels Sprout', 'Fresh brussels sprouts, great for roasting.', 3.69, 4.50, 20, 'active', 'https://images.unsplash.com/photo-1670843840538-9fe8d95b59f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxicnVzc2VscyUyMHNwcm91dHxlbnwwfHx8fDE3Njg5MDA4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080', '{}', '1lb', 'brussels-sprout');

INSERT INTO public.product_categories (product_id, category_id) VALUES
(1, 11),
(2, 12),
(3, 11),
(4, 12);

INSERT INTO public.product_tags (product_id, tag_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 1),
(2, 2),
(3, 1),
(3, 2),
(4, 1),
(4, 3);

INSERT INTO public.pages (id, slug, title, content, updated_at) OVERRIDING SYSTEM VALUE VALUES
(1, 'about', 'About Us', '{"title": "About Pickbazar", "subtitle": "Your daily dose of freshness, delivered.", "missionTitle": "Our Mission", "missionText": "<p>Our mission is simple: to bring you the freshest, highest-quality groceries with the convenience of home delivery. We believe that everyone deserves access to fresh food, and we''re passionate about making that a reality for our community.</p>", "teamTitle": "Meet the Team", "team": [{"name": "John Doe", "role": "CEO & Founder", "bio": "<p>John is the visionary behind Pickbazar, driven by a passion for fresh food and technology.</p>"}, {"name": "Jane Smith", "role": "Head of Operations", "bio": "<p>Jane ensures that every order is packed with care and delivered on time.</p>"}, {"name": "Peter Jones", "role": "Lead Developer", "bio": "<p>Peter is the architect of our seamless online shopping experience.</p>"}]}', '2024-01-01 00:00:00+00'),
(2, 'contact', 'Contact Us', '{"address": "123 Grocery Lane, Foodie City, 12345", "email": "support@pickbazar.com", "phone": "+1 (800) 555-0199"}', '2024-01-01 00:00:00+00'),
(3, 'faq', 'Frequently Asked Questions', '{"faqs": [{"question": "How does the delivery process work?", "answer": "We offer delivery within 90 minutes for most locations. Once you place an order, our system assigns it to the nearest delivery partner. You will receive a notification once your order is out for delivery."}, {"question": "What is your return policy?", "answer": "We have a no-questions-asked return policy for most items within 24 hours of delivery, provided the items are in their original packaging and condition."}]}', '2024-01-01 00:00:00+00'),
(4, 'privacy-policy', 'Privacy Policy', '{"html": "<h2>1. Information We Collect</h2><p>We collect information you provide directly to us, such as when you create an account, place an order, or contact customer service.</p><h2>2. How We Use Information</h2><p>We use the information we collect to provide, maintain, and improve our services, including to process transactions and fulfill orders.</p>"}', '2024-01-01 00:00:00+00'),
(5, 'terms-and-conditions', 'Terms & Conditions', '{"html": "<h2>1. Agreement to Terms</h2><p>By using our services, you agree to be bound by these Terms. If you don’t agree to be bound by these Terms, do not use the Services.</p><h2>2. Changes to Terms or Services</h2><p>We may update the Terms at any time, in our sole discretion. If we do so, we’ll let you know either by posting the updated Terms on the Site or through other communications.</p>"}', '2024-01-01 00:00:00+00');


-- Functions
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

CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status order_status
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id bigint;
    v_order_number text;
    v_user_id uuid;
    item record;
BEGIN
    SELECT auth.uid() INTO v_user_id;

    v_order_number := 'PB-' || to_char(now(), 'YYMMDD') || '-' || nextval('orders_id_seq');

    -- Create the order
    INSERT INTO public.orders(order_number, user_id, total_amount, shipping_details, status, coupon_code, discount_amount)
    VALUES (v_order_number, v_user_id, p_total_amount, p_shipping_details, p_initial_status, p_coupon_code, p_discount_amount)
    RETURNING id INTO v_order_id;

    -- Insert order items and update stock
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id int, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items(order_id, product_id, quantity, price_at_purchase)
        VALUES (v_order_id, item.product_id, item.quantity, item.price);

        UPDATE public.products
        SET stock = stock - item.quantity
        WHERE id = item.product_id;
    END LOOP;
    
    -- Create transaction record
    INSERT INTO public.transactions(order_id, amount, payment_method, status, transaction_details)
    VALUES (v_order_id, p_total_amount, p_payment_method, 'Completed', p_transaction_details);

    RETURN v_order_number;
END;
$$;


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

-- Triggers
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE TRIGGER on_order_status_change
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE PROCEDURE public.log_order_status_change();
  
CREATE OR REPLACE TRIGGER on_order_insert_log_status
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE PROCEDURE public.log_order_status_change();

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own orders." ON public.orders;
CREATE POLICY "Users can view their own orders." ON public.orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create orders for themselves." ON public.orders;
CREATE POLICY "Users can create orders for themselves." ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own addresses." ON public.addresses;
CREATE POLICY "Users can manage their own addresses." ON public.addresses FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own cards." ON public.cards;
CREATE POLICY "Users can manage their own cards." ON public.cards FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are public." ON public.reviews;
CREATE POLICY "Reviews are public." ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own reviews." ON public.reviews;
CREATE POLICY "Users can manage their own reviews." ON public.reviews FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Questions are public." ON public.questions;
CREATE POLICY "Questions are public." ON public.questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own questions." ON public.questions;
CREATE POLICY "Users can manage their own questions." ON public.questions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own wishlist." ON public.wishlist;
CREATE POLICY "Users can manage their own wishlist." ON public.wishlist FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own refunds." ON public.refunds;
CREATE POLICY "Users can manage their own refunds." ON public.refunds FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own transactions." ON public.transactions;
CREATE POLICY "Users can view their own transactions." ON public.transactions FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = transactions.order_id AND orders.user_id = auth.uid()));

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
CREATE POLICY "Users can view their own notifications." ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admin notifications are viewable by admins." ON public.notifications;
CREATE POLICY "Admin notifications are viewable by admins." ON public.notifications FOR SELECT USING (user_id IS NULL AND public.is_admin(auth.uid()));

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings are public." ON public.settings;
CREATE POLICY "Settings are public." ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can update settings." ON public.settings;
CREATE POLICY "Admins can update settings." ON public.settings FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Promos are public." ON public.promos;
CREATE POLICY "Promos are public." ON public.promos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage promos." ON public.promos;
CREATE POLICY "Admins can manage promos." ON public.promos FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Offers are public." ON public.offers;
CREATE POLICY "Offers are public." ON public.offers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage offers." ON public.offers;
CREATE POLICY "Admins can manage offers." ON public.offers FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage contact messages." ON public.contact_messages;
CREATE POLICY "Admins can manage contact messages." ON public.contact_messages FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Home page sections are public." ON public.home_page_sections;
CREATE POLICY "Home page sections are public." ON public.home_page_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage home page sections." ON public.home_page_sections;
CREATE POLICY "Admins can manage home page sections." ON public.home_page_sections FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pages are public." ON public.pages;
CREATE POLICY "Pages are public." ON public.pages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage pages." ON public.pages;
CREATE POLICY "Admins can manage pages." ON public.pages FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are public." ON public.products;
CREATE POLICY "Products are public." ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage products." ON public.products;
CREATE POLICY "Admins can manage products." ON public.products FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are public." ON public.categories;
CREATE POLICY "Categories are public." ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage categories." ON public.categories;
CREATE POLICY "Admins can manage categories." ON public.categories FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tags are public." ON public.tags;
CREATE POLICY "Tags are public." ON public.tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage tags." ON public.tags;
CREATE POLICY "Admins can manage tags." ON public.tags FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


-- Additional Functions and RPCs
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id AND role IN ('admin', 'super-admin', 'manager')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id uuid, full_name text, email text, avatar_url text, role user_role, created_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.id, p.full_name, u.email, p.avatar_url, p.role, u.created_at
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id;
$$;

CREATE OR REPLACE FUNCTION public.get_all_settings()
RETURNS TABLE(j json)
LANGUAGE sql
AS $$
    SELECT json_object_agg(key, value)
    FROM public.settings;
$$;

CREATE OR REPLACE FUNCTION public.get_related_products(p_id integer, p_limit integer)
RETURNS TABLE(id bigint, name text, price numeric, original_price numeric, featured_image_url text, unit text)
LANGUAGE plpgsql
AS $$
DECLARE
    v_category_id bigint;
BEGIN
    SELECT category_id INTO v_category_id FROM public.product_categories WHERE product_id = p_id LIMIT 1;
    
    RETURN QUERY
    SELECT p.id, p.name, p.price, p.original_price, p.featured_image_url, p.unit
    FROM public.products p
    JOIN public.product_categories pc ON p.id = pc.product_id
    WHERE pc.category_id = v_category_id AND p.id <> p_id AND p.status = 'active'
    ORDER BY p.view_count DESC
    LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_product_view(product_id_to_inc integer)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.products
  SET view_count = view_count + 1
  WHERE id = product_id_to_inc;
$$;


CREATE OR REPLACE FUNCTION public.toggle_wishlist_item(p_user_id uuid, p_product_id integer)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_exists boolean;
    v_status text;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.wishlist WHERE user_id = p_user_id AND product_id = p_product_id) INTO v_exists;

    IF v_exists THEN
        DELETE FROM public.wishlist WHERE user_id = p_user_id AND product_id = p_product_id;
        v_status := 'removed';
    ELSE
        INSERT INTO public.wishlist (user_id, product_id) VALUES (p_user_id, p_product_id);
        v_status := 'added';
    END IF;

    RETURN json_build_object('status', v_status);
END;
$$;


CREATE OR REPLACE FUNCTION public.get_user_wishlist_ids(p_user_id uuid)
RETURNS TABLE(product_id integer)
LANGUAGE sql
AS $$
  SELECT product_id FROM public.wishlist WHERE user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.update_order_status_and_log(p_order_id integer, p_new_status text)
RETURNS TABLE(user_id uuid, order_number text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id bigint;
BEGIN
    UPDATE public.orders
    SET status = p_new_status::order_status
    WHERE id = p_order_id
    RETURNING orders.user_id, orders.order_number INTO v_order_id, order_number;
    
    RETURN QUERY SELECT v_order_id, order_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE(id bigint, order_number text, created_at text, total_amount numeric, status order_status, shipping_details jsonb, profiles jsonb, order_items jsonb, coupon_code text, discount_amount numeric, payment_method text, transaction_details jsonb)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        o.created_at::text,
        o.total_amount,
        o.status,
        o.shipping_details,
        jsonb_build_object('full_name', p.full_name, 'avatar_url', p.avatar_url),
        (SELECT jsonb_agg(jsonb_build_object(
            'id', oi.id, 
            'quantity', oi.quantity, 
            'price_at_purchase', oi.price_at_purchase,
            'products', jsonb_build_object('name', pr.name, 'featured_image_url', pr.featured_image_url)
        )) FROM public.order_items oi JOIN public.products pr ON oi.product_id = pr.id WHERE oi.order_id = o.id),
        o.coupon_code,
        o.discount_amount,
        (SELECT t.payment_method FROM public.transactions t WHERE t.order_id = o.id LIMIT 1),
        (SELECT t.transaction_details FROM public.transactions t WHERE t.order_id = o.id LIMIT 1)
    FROM public.orders o
    LEFT JOIN public.profiles p ON o.user_id = p.id
    WHERE o.order_number = p_order_number;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE(id bigint, order_number text, created_at text, total_amount numeric, status order_status, customer_name text, customer_email text, customer_avatar_url text)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        o.created_at::text,
        o.total_amount,
        o.status,
        p.full_name,
        o.shipping_details->>'email',
        p.avatar_url
    FROM public.orders o
    LEFT JOIN public.profiles p ON o.user_id = p.id
    ORDER BY o.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_reviews()
RETURNS TABLE(id integer, rating integer, text text, status text, created_at text, author jsonb, product jsonb)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.rating,
    r.text,
    r.status,
    r.created_at::text,
    jsonb_build_object(
      'name', p.full_name,
      'avatar_url', p.avatar_url
    ),
    jsonb_build_object(
      'id', pr.id,
      'name', pr.name,
      'featured_image_url', pr.featured_image_url
    )
  FROM public.reviews r
  JOIN public.profiles p ON r.user_id = p.id
  JOIN public.products pr ON r.product_id = pr.id
  ORDER BY r.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_questions()
RETURNS TABLE(id integer, question text, answer text, status text, date text, author jsonb, product jsonb)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.question_text,
    q.answer_text,
    q.status,
    q.created_at::text,
    jsonb_build_object(
      'name', p.full_name,
      'avatar', jsonb_build_object(
        'imageUrl', p.avatar_url,
        'imageHint', 'person face'
      )
    ),
    jsonb_build_object(
      'id', pr.id,
      'name', pr.name,
      'image', jsonb_build_object(
        'imageUrl', pr.featured_image_url,
        'imageHint', 'product'
      )
    )
  FROM public.questions q
  JOIN public.profiles p ON q.user_id = p.id
  JOIN public.products pr ON q.product_id = pr.id
  ORDER BY q.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_refunds()
RETURNS TABLE(id integer, order_id bigint, order_number text, amount numeric, status text, reason text, created_at text, user_id uuid, customer_name text, customer_avatar_url text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.order_id,
    o.order_number,
    r.amount,
    r.status,
    r.reason,
    r.created_at::text,
    r.user_id,
    p.full_name,
    p.avatar_url
  FROM public.refunds r
  JOIN public.profiles p ON r.user_id = p.id
  JOIN public.orders o ON r.order_id = o.id
  ORDER BY r.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_rating_stats(p_product_id integer)
RETURNS TABLE(avg_rating numeric, total_reviews bigint, rating_distribution jsonb)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(id),
    (SELECT jsonb_agg(t) FROM (
      SELECT r.rating, COUNT(r.id) as count
      FROM public.reviews r
      WHERE r.product_id = p_product_id AND r.status = 'Approved'
      GROUP BY r.rating
    ) t)
  FROM public.reviews
  WHERE product_id = p_product_id AND status = 'Approved';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_reviews(p_product_id integer)
RETURNS TABLE(id integer, rating integer, text text, created_at text, author_name text, author_avatar text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.rating,
    r.text,
    r.created_at::text,
    p.full_name,
    p.avatar_url
  FROM public.reviews r
  JOIN public.profiles p ON r.user_id = p.id
  WHERE r.product_id = p_product_id AND r.status = 'Approved'
  ORDER BY r.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_questions(p_product_id integer)
RETURNS TABLE(id integer, question_text text, answer_text text, created_at text, author_name text, author_avatar text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.question_text,
    q.answer_text,
    q.created_at::text,
    p.full_name,
    p.avatar_url
  FROM public.questions q
  JOIN public.profiles p ON q.user_id = p.id
  WHERE q.product_id = p_product_id
  ORDER BY q.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_questions(p_user_id uuid)
RETURNS TABLE(id integer, question_text text, answer_text text, status text, created_at text, product_name text, product_id integer, product_image text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.question_text,
    q.answer_text,
    q.status,
    q.created_at::text,
    p.name,
    p.id,
    p.featured_image_url
  FROM public.questions q
  JOIN public.products p ON q.product_id = p.id
  WHERE q.user_id = p_user_id
  ORDER BY q.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_reviews(p_user_id uuid)
RETURNS TABLE(id integer, rating integer, text text, status text, created_at text, product_name text, product_id integer, product_image text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.rating,
    r.text,
    r.status,
    r.created_at::text,
    p.name,
    p.id,
    p.featured_image_url
  FROM public.reviews r
  JOIN public.products p ON r.product_id = p.id
  WHERE r.user_id = p_user_id
  ORDER BY r.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_refunds(p_user_id uuid)
RETURNS TABLE(id integer, order_id bigint, order_number text, amount numeric, status text, reason text, created_at text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.order_id,
    o.order_number,
    r.amount,
    r.status,
    r.reason,
    r.created_at::text
  FROM public.refunds r
  JOIN public.orders o ON r.order_id = o.id
  WHERE r.user_id = p_user_id
  ORDER BY r.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_transactions(p_user_id uuid)
RETURNS TABLE(id integer, order_id bigint, order_number text, amount numeric, payment_method text, status text, created_at text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.order_id,
    o.order_number,
    t.amount,
    t.payment_method,
    t.status,
    t.created_at::text
  FROM public.transactions t
  JOIN public.orders o ON t.order_id = o.id
  WHERE o.user_id = p_user_id
  ORDER BY t.created_at DESC;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_contact_messages()
RETURNS TABLE(id integer, "senderName" text, senderemail text, subject text, message text, date text, status text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT cm.id, cm.name, cm.email, cm.subject, cm.message, cm.created_at::text, cm.status
  FROM public.contact_messages cm
  ORDER BY cm.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_contact_message_details(p_message_id integer)
RETURNS TABLE(id integer, "senderName" text, "senderEmail" text, subject text, message text, date text, status text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.name, m.email, m.subject, m.message, m.created_at::text, m.status
  FROM public.contact_messages m
  WHERE m.id = p_message_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_admin_notifications()
RETURNS TABLE(id bigint, title text, message text, link text, is_read boolean, created_at text, type notification_type)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT n.id, n.title, n.message, n.link, n.is_read, n.created_at::text, n.type
  FROM public.notifications n
  WHERE n.user_id IS NULL
  ORDER BY n.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_question_details(p_question_id integer)
RETURNS TABLE(id integer, question text, answer text, status text, date text, author jsonb, product jsonb)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.question_text,
    q.answer_text,
    q.status,
    q.created_at::text,
    jsonb_build_object(
      'name', p.full_name,
      'avatar', jsonb_build_object(
        'imageUrl', p.avatar_url,
        'imageHint', 'person face'
      )
    ),
    jsonb_build_object(
      'id', pr.id,
      'name', pr.name,
      'image', jsonb_build_object(
        'imageUrl', pr.featured_image_url,
        'imageHint', 'product'
      )
    )
  FROM public.questions q
  JOIN public.profiles p ON q.user_id = p.id
  JOIN public.products pr ON q.product_id = pr.id
  WHERE q.id = p_question_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_order_history(p_order_id bigint)
RETURNS TABLE(status text, created_at text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT h.status::text, h.created_at::text
  FROM public.order_history h
  WHERE h.order_id = p_order_id
  ORDER BY h.created_at;
END;
$$;


CREATE OR REPLACE FUNCTION public.update_home_sections(sections_data jsonb)
RETURNS void AS
$$
BEGIN
    -- First, delete all existing sections
    DELETE FROM public.home_page_sections;

    -- Then, insert the new sections from the JSON data
    INSERT INTO public.home_page_sections (category_id, display_order)
    SELECT
        (elem->>'category_id')::bigint,
        (elem->>'display_order')::integer
    FROM jsonb_array_elements(sections_data) elem;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_category_tree()
RETURNS TABLE(name text, subcategories jsonb)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
      p.name,
      jsonb_agg(c.name)
  FROM
      public.categories p
  LEFT JOIN
      public.categories c ON c.parent_id = p.id
  WHERE
      p.parent_id IS NULL
  GROUP BY
      p.id, p.name;
END;
$$;


-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.addresses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.cards TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.categories TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.contact_messages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.home_page_sections TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.notifications TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.offers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.order_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.pages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.product_categories TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.product_tags TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.promos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.questions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.refunds TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.reviews TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tags TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.transactions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.wishlist TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.addresses_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.cards_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.categories_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.contact_messages_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.home_page_sections_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.notifications_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.offers_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.order_items_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.orders_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.pages_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.products_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.promos_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.questions_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.refunds_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.reviews_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.tags_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.transactions_id_seq TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.wishlist_id_seq TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.order_history TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.order_history_id_seq TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.is_admin(p_user_id uuid) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_all_users() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_all_settings() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_related_products(p_id integer, p_limit integer) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.increment_product_view(product_id_to_inc integer) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.toggle_wishlist_item(p_user_id uuid, p_product_id integer) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_user_wishlist_ids(p_user_id uuid) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.update_order_status_and_log(p_order_id integer, p_new_status text) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_admin_order_details(p_order_number text) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_admin_order_list() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_admin_reviews() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_admin_questions() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_admin_refunds() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_product_rating_stats(p_product_id integer) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_product_reviews(p_product_id integer) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_product_questions(p_product_id integer) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_user_questions(p_user_id uuid) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_user_reviews(p_user_id uuid) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_user_refunds(p_user_id uuid) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_user_transactions(p_user_id uuid) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_contact_messages() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_contact_message_details(p_message_id integer) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_admin_notifications() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_admin_question_details(p_question_id integer) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_order_history(p_order_id bigint) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.update_home_sections(sections_data jsonb) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_category_tree() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status order_status) TO anon, authenticated, service_role;


