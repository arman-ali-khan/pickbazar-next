
-- Drop existing types and functions if they exist to avoid conflicts
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP FUNCTION IF EXISTS public.create_order(numeric,jsonb,jsonb,text,jsonb,text,numeric) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.log_order_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.update_order_status_and_log(integer,order_status) CASCADE;

-- Create custom types
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

-- Create sequences if they do not exist
CREATE SEQUENCE IF NOT EXISTS public.addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.contact_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.home_page_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.order_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.pages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.product_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.product_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.promos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.refunds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.wishlist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create tables if they do not exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    updated_at timestamp with time zone,
    full_name text,
    avatar_url text,
    bio text,
    contact_number text,
    role public.user_role DEFAULT 'customer'::public.user_role,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.addresses (
    id bigint NOT NULL,
    user_id uuid,
    address_type text NOT NULL,
    title text,
    country text,
    city text,
    state text,
    zip text,
    street_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);
ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.cards (
    id bigint NOT NULL,
    user_id uuid,
    card_type text,
    last4 text,
    expiry_month integer,
    expiry_year integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.cards ALTER COLUMN id SET DEFAULT nextval('public.cards_id_seq'::regclass);
ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    icon character varying(255),
    description text,
    parent_id integer,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);
ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.products (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255),
    description text,
    price numeric(10,2) NOT NULL,
    original_price numeric(10,2),
    stock integer DEFAULT 0 NOT NULL,
    unit character varying(50),
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    featured_image_url text,
    gallery_urls jsonb,
    view_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);
ALTER TABLE public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);

CREATE TABLE IF NOT EXISTS public.orders (
    id integer NOT NULL,
    user_id uuid,
    order_number character varying(255) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status public.order_status DEFAULT 'Pending'::public.order_status NOT NULL,
    shipping_details jsonb,
    payment_details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    discount_amount numeric(10,2),
    coupon_code text,
    payment_method text
);
ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

CREATE TABLE IF NOT EXISTS public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    price_at_purchase numeric(10,2) NOT NULL
);
ALTER TABLE public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.order_history (
    id integer NOT NULL,
    order_id integer NOT NULL,
    status public.order_status NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.order_history ALTER COLUMN id SET DEFAULT nextval('public.order_history_id_seq'::regclass);
ALTER TABLE ONLY public.order_history
    ADD CONSTRAINT order_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_history
    ADD CONSTRAINT order_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

-- Other tables
CREATE TABLE IF NOT EXISTS public.contact_messages ( id bigint NOT NULL, name text, email text, subject text, message text, status text DEFAULT 'unread'::text, created_at timestamp with time zone DEFAULT now() NOT NULL );
ALTER TABLE public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);
ALTER TABLE ONLY public.contact_messages ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);

CREATE TABLE IF NOT EXISTS public.home_page_sections ( id integer NOT NULL, category_id integer NOT NULL, display_order integer NOT NULL );
ALTER TABLE public.home_page_sections ALTER COLUMN id SET DEFAULT nextval('public.home_page_sections_id_seq'::regclass);
ALTER TABLE ONLY public.home_page_sections ADD CONSTRAINT home_page_sections_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.home_page_sections ADD CONSTRAINT home_page_sections_category_id_key UNIQUE (category_id);
ALTER TABLE ONLY public.home_page_sections ADD CONSTRAINT home_page_sections_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.notifications ( id bigint NOT NULL, user_id uuid, title text NOT NULL, message text, link text, is_read boolean DEFAULT false NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, type text );
ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.offers ( id integer NOT NULL, title text NOT NULL, subtitle text, code text NOT NULL, discount_percentage numeric(5,2) NOT NULL, status text DEFAULT 'inactive'::text, start_date timestamp with time zone, end_date timestamp with time zone, image_url text, category_ids jsonb, product_ids jsonb, created_at timestamp with time zone DEFAULT now() );
ALTER TABLE public.offers ALTER COLUMN id SET DEFAULT nextval('public.offers_id_seq'::regclass);
ALTER TABLE ONLY public.offers ADD CONSTRAINT offers_code_key UNIQUE (code);
ALTER TABLE ONLY public.offers ADD CONSTRAINT offers_pkey PRIMARY KEY (id);

CREATE TABLE IF NOT EXISTS public.pages ( id integer NOT NULL, slug text NOT NULL, title text NOT NULL, content jsonb, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now() );
ALTER TABLE public.pages ALTER COLUMN id SET DEFAULT nextval('public.pages_id_seq'::regclass);
ALTER TABLE ONLY public.pages ADD CONSTRAINT pages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.pages ADD CONSTRAINT pages_slug_key UNIQUE (slug);

CREATE TABLE IF NOT EXISTS public.product_categories ( id integer NOT NULL, product_id integer NOT NULL, category_id integer NOT NULL );
ALTER TABLE public.product_categories ALTER COLUMN id SET DEFAULT nextval('public.product_categories_id_seq'::regclass);
ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_product_id_category_id_key UNIQUE (product_id, category_id);
ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.tags ( id integer NOT NULL, name character varying(255) NOT NULL, slug character varying(255) NOT NULL, created_at timestamp with time zone DEFAULT now() );
ALTER TABLE public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);
ALTER TABLE ONLY public.tags ADD CONSTRAINT tags_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tags ADD CONSTRAINT tags_slug_key UNIQUE (slug);

CREATE TABLE IF NOT EXISTS public.product_tags ( id integer NOT NULL, product_id integer NOT NULL, tag_id integer NOT NULL );
ALTER TABLE public.product_tags ALTER COLUMN id SET DEFAULT nextval('public.product_tags_id_seq'::regclass);
ALTER TABLE ONLY public.product_tags ADD CONSTRAINT product_tags_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_tags ADD CONSTRAINT product_tags_product_id_tag_id_key UNIQUE (product_id, tag_id);
ALTER TABLE ONLY public.product_tags ADD CONSTRAINT product_tags_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_tags ADD CONSTRAINT product_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.promos ( id integer NOT NULL, title text NOT NULL, subtitle text, button_text text, button_link text, status text DEFAULT 'inactive'::text, image_url text, created_at timestamp with time zone DEFAULT now() );
ALTER TABLE public.promos ALTER COLUMN id SET DEFAULT nextval('public.promos_id_seq'::regclass);
ALTER TABLE ONLY public.promos ADD CONSTRAINT promos_pkey PRIMARY KEY (id);

CREATE TABLE IF NOT EXISTS public.questions ( id integer NOT NULL, user_id uuid NOT NULL, product_id integer NOT NULL, question_text text NOT NULL, answer_text text, status text DEFAULT 'Pending'::text, created_at timestamp with time zone DEFAULT now(), answered_at timestamp with time zone );
ALTER TABLE public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);
ALTER TABLE ONLY public.questions ADD CONSTRAINT questions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.questions ADD CONSTRAINT questions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.questions ADD CONSTRAINT questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.refunds ( id integer NOT NULL, order_id integer NOT NULL, user_id uuid NOT NULL, amount numeric(10,2) NOT NULL, reason text NOT NULL, status text DEFAULT 'Pending'::text, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone );
ALTER TABLE public.refunds ALTER COLUMN id SET DEFAULT nextval('public.refunds_id_seq'::regclass);
ALTER TABLE ONLY public.refunds ADD CONSTRAINT refunds_order_id_key UNIQUE (order_id);
ALTER TABLE ONLY public.refunds ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.refunds ADD CONSTRAINT refunds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.refunds ADD CONSTRAINT refunds_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.reviews ( id integer NOT NULL, user_id uuid NOT NULL, product_id integer NOT NULL, rating integer NOT NULL, text text, status text DEFAULT 'Pending'::text NOT NULL, created_at timestamp with time zone DEFAULT now() );
ALTER TABLE public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_user_id_product_id_key UNIQUE (user_id, product_id);

CREATE TABLE IF NOT EXISTS public.settings ( id integer NOT NULL, key text NOT NULL, value text, created_at timestamp with time zone DEFAULT now() );
ALTER TABLE public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);
ALTER TABLE ONLY public.settings ADD CONSTRAINT settings_key_key UNIQUE (key);
ALTER TABLE ONLY public.settings ADD CONSTRAINT settings_pkey PRIMARY KEY (id);

CREATE TABLE IF NOT EXISTS public.transactions ( id integer NOT NULL, order_id integer NOT NULL, amount numeric(10,2) NOT NULL, payment_method text, transaction_details jsonb, status text, created_at timestamp with time zone DEFAULT now() );
ALTER TABLE public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);
ALTER TABLE ONLY public.transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.transactions ADD CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.wishlist ( id integer NOT NULL, user_id uuid NOT NULL, product_id integer NOT NULL, created_at timestamp with time zone DEFAULT now() );
ALTER TABLE public.wishlist ALTER COLUMN id SET DEFAULT nextval('public.wishlist_id_seq'::regclass);
ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_user_id_product_id_key UNIQUE (user_id, product_id);
ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Insert initial data
-- We use OVERRIDING SYSTEM VALUE to specify IDs for sample data
-- This ensures consistency for relationships (e.g. product categories)

TRUNCATE public.categories, public.products, public.product_categories, public.tags, public.product_tags, public.pages RESTART IDENTITY CASCADE;

INSERT INTO public.categories (id, name, slug, icon, parent_id) OVERRIDING SYSTEM VALUE VALUES
(1, 'Fruits & Vegetables', 'fruits-vegetables', 'Apple', NULL),
(2, 'Meat & Fish', 'meat-fish', 'Beef', NULL),
(3, 'Dairy', 'dairy', 'Milk', NULL),
(4, 'Snacks', 'snacks', 'Cookie', NULL),
(5, 'Beverages', 'beverages', 'GlassWater', NULL),
(6, 'Fruits', 'fruits', 'Grape', 1),
(7, 'Vegetables', 'vegetables', 'Carrot', 1);

INSERT INTO public.products (id, name, slug, description, price, original_price, stock, unit, status, featured_image_url) OVERRIDING SYSTEM VALUE VALUES
(1, 'Fresh Apples', 'fresh-apples', 'Crisp and juicy red apples.', 1.99, 2.49, 100, '1lb', 'active', 'https://images.unsplash.com/photo-1439127989242-c3749a012eac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxyZWQlMjBhcHBsZXN8ZW58MHx8fHwxNzY4ODg3MzQxfDA&ixlib=rb-4.1.0&q=80&w=1080'),
(2, 'Organic Bananas', 'organic-bananas', 'A bunch of sweet organic bananas.', 0.99, NULL, 150, '1lb', 'active', 'https://images.unsplash.com/photo-1606757389667-45c2024f9fa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxibHVlYmVycmllc3xlbnwwfHx8fDE3Njg5MDQ2ODR8MA&ixlib=rb-4.1.0&q=80&w=1080'),
(3, 'Baby Spinach', 'baby-spinach', 'Fresh and tender baby spinach leaves.', 2.49, NULL, 80, '5oz bag', 'active', 'https://images.unsplash.com/photo-1598278242809-6c21ee17aef1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxzcGluYWNofGVufDB8fHx8MTc2ODk3ODI1N3ww&ixlib=rb-4.1.0&q=80&w=1080'),
(4, 'Lean Ground Beef', 'lean-ground-beef', '93% lean ground beef, perfect for any recipe.', 5.99, 6.99, 50, '1lb', 'active', 'https://picsum.photos/seed/beef/600/400'),
(5, 'Salmon Fillet', 'salmon-fillet', 'Fresh, wild-caught salmon fillet.', 12.99, NULL, 30, 'per lb', 'active', 'https://picsum.photos/seed/salmon/600/400'),
(6, 'Whole Milk', 'whole-milk', 'Gallon of fresh whole milk.', 3.49, NULL, 60, '1 gal', 'active', 'https://picsum.photos/seed/milk/600/400'),
(7, 'Cheddar Cheese Block', 'cheddar-cheese-block', 'Sharp cheddar cheese block.', 4.99, NULL, 75, '8oz', 'active', 'https://picsum.photos/seed/cheese/600/400');

INSERT INTO public.product_categories (product_id, category_id) VALUES
(1, 6), (2, 6), (3, 7), (4, 2), (5, 2), (6, 3), (7, 3);

INSERT INTO public.tags (id, name, slug) OVERRIDING SYSTEM VALUE VALUES
(1, 'Organic', 'organic'),
(2, 'On Sale', 'on-sale'),
(3, 'New', 'new'),
(4, 'Gluten-Free', 'gluten-free');

INSERT INTO public.product_tags (product_id, tag_id) VALUES
(2, 1), (1, 2), (3, 1), (3, 3);

INSERT INTO public.pages (slug, title, content) VALUES
('about', 'About Us', '{"title": "About Our Store", "subtitle": "Your daily dose of freshness.", "missionTitle": "Our Mission", "missionText": "<p>To provide the freshest, highest-quality groceries to our community at fair prices.</p>", "teamTitle": "Meet the Team", "team": [{"name": "John Doe", "role": "Founder & CEO", "bio": "<p>John started this store with a passion for fresh food.</p>"}, {"name": "Jane Smith", "role": "Head of Operations", "bio": "<p>Jane ensures everything runs smoothly from farm to your door.</p>"}]}'),
('contact', 'Contact Us', '{"address": "123 Green St, Foodie City, 12345", "email": "hello@pickbazar.com", "phone": "(123) 456-7890"}'),
('faq', 'Frequently Asked Questions', '{"faqs": [{"question": "What are your delivery hours?", "answer": "We deliver from 8 AM to 10 PM, every day."}]}'),
('privacy-policy', 'Privacy Policy', '{"html": "<h1>Privacy Policy</h1><p>Your privacy is important to us. This is a placeholder policy.</p>"}'),
('terms-and-conditions', 'Terms & Conditions', '{"html": "<h1>Terms & Conditions</h1><p>By using our service, you agree to these terms. This is a placeholder.</p>"}');


-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status DEFAULT 'Pending'::public.order_status)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    new_order_id INT;
    new_order_number TEXT;
    item JSONB;
BEGIN
    -- Generate a unique order number
    new_order_number := 'PB-' || to_char(now(), 'YYYYMMDD') || '-' || nextval('orders_id_seq');

    -- Insert the order
    INSERT INTO public.orders (user_id, order_number, total_amount, shipping_details, payment_method, coupon_code, discount_amount, status)
    VALUES (auth.uid(), new_order_number, p_total_amount, p_shipping_details, p_payment_method, p_coupon_code, p_discount_amount, p_initial_status)
    RETURNING id INTO new_order_id;

    -- Insert order items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, (item->>'product_id')::INT, (item->>'quantity')::INT, (item->>'price')::NUMERIC);
    END LOOP;
    
    -- Insert transaction details if provided
    IF p_payment_method IS NOT NULL THEN
        INSERT INTO public.transactions(order_id, amount, payment_method, transaction_details, status)
        VALUES (new_order_id, p_total_amount, p_payment_method, p_transaction_details, 'Completed');
    END IF;

    RETURN new_order_number;
END;
$function$;

-- Add other functions similarly...

-- Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  
DROP TRIGGER IF EXISTS after_order_status_update ON public.orders;
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.order_history(order_id, status)
    VALUES(NEW.id, NEW.status);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_order_status_update
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();


-- Policies
-- Drop policies before creating them
DROP POLICY IF EXISTS "Enable read access for all users" ON public.addresses;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.addresses;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.addresses;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.addresses;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cards;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.cards;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.cards;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
-- Add DROP statements for all other policies...

-- Recreate policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users only" ON public.addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for users based on user_id" ON public.addresses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable delete for users based on user_id" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users only" ON public.cards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable delete for users based on user_id" ON public.cards FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.categories FOR SELECT USING (true);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for all users" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for admins" ON public.contact_messages FOR SELECT USING (public.is_admin());

ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.home_page_sections FOR SELECT USING (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for users based on user_id" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable update for users based on user_id" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.offers FOR SELECT USING (true);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for users based on user_id" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users only" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for admins" ON public.orders FOR UPDATE USING (public.is_admin());

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for users based on order" ON public.order_items FOR SELECT USING (
  (EXISTS ( SELECT 1 FROM public.orders WHERE ((orders.id = order_items.order_id) AND (orders.user_id = auth.uid()))))
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.pages FOR SELECT USING (true);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.product_categories FOR SELECT USING (true);

ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.product_tags FOR SELECT USING (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);

ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.promos FOR SELECT USING (true);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.questions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for admins" ON public.questions FOR UPDATE USING (public.is_admin());

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for users based on user_id or admin" ON public.refunds FOR SELECT USING ((auth.uid() = user_id) OR public.is_admin());
CREATE POLICY "Enable insert for authenticated users only" ON public.refunds FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for admins" ON public.refunds FOR UPDATE USING (public.is_admin());
CREATE POLICY "Enable delete for users if status is pending" ON public.refunds FOR DELETE USING ((auth.uid() = user_id) AND (status = 'Pending'::text));

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.reviews FOR SELECT USING ((status = 'Approved'::text) OR (auth.uid() = user_id));
CREATE POLICY "Enable insert for authenticated users only" ON public.reviews FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for admins" ON public.reviews FOR UPDATE USING (public.is_admin());

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.settings FOR SELECT USING (true);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.tags FOR SELECT USING (true);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for users based on order" ON public.transactions FOR SELECT USING (
  (EXISTS ( SELECT 1 FROM public.orders WHERE ((orders.id = transactions.order_id) AND (orders.user_id = auth.uid()))))
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for users based on user_id" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable all for users based on user_id" ON public.wishlist FOR ALL USING (auth.uid() = user_id);

-- Helper function for admin checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role public.user_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role IN ('admin', 'super-admin');
END;
$$;
