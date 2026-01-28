-- Drop old, conflicting functions first to avoid errors on replacement.
DROP FUNCTION IF EXISTS public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric);
DROP FUNCTION IF EXISTS public.create_order(numeric,jsonb,jsonb,text,jsonb,text,numeric,order_status);


-- Create ENUM types if they don't exist
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
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
        CREATE TYPE public.role AS ENUM (
            'customer',
            'manager',
            'admin',
            'super-admin'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
       CREATE TYPE public.notification_type AS ENUM (
            'new_order',
            'new_review',
            'new_question',
            'question_answered',
            'new_refund',
            'refund_update',
            'order_update',
            'role_update',
            'new_message',
            'promotion'
        );
    END IF;
END$$;


-- Create Tables with "IF NOT EXISTS"
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    role public.role DEFAULT 'customer'::public.role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    bio text,
    contact_number text,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.products (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    original_price numeric,
    stock integer DEFAULT 0 NOT NULL,
    unit text,
    status text DEFAULT 'draft'::text NOT NULL,
    featured_image_url text,
    gallery_urls text[],
    slug text NOT NULL,
    view_count integer DEFAULT 0,
    CONSTRAINT products_pkey PRIMARY KEY (id),
    CONSTRAINT products_slug_key UNIQUE (slug)
);
CREATE SEQUENCE IF NOT EXISTS public.products_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;
ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


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
);
CREATE SEQUENCE IF NOT EXISTS public.categories_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;
ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


CREATE TABLE IF NOT EXISTS public.tags (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    CONSTRAINT tags_pkey PRIMARY KEY (id),
    CONSTRAINT tags_name_key UNIQUE (name),
    CONSTRAINT tags_slug_key UNIQUE (slug)
);
CREATE SEQUENCE IF NOT EXISTS public.tags_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;
ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


CREATE TABLE IF NOT EXISTS public.product_categories (
    product_id bigint NOT NULL,
    category_id bigint NOT NULL,
    CONSTRAINT product_categories_pkey PRIMARY KEY (product_id, category_id),
    CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE,
    CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.product_tags (
    product_id bigint NOT NULL,
    tag_id bigint NOT NULL,
    CONSTRAINT product_tags_pkey PRIMARY KEY (product_id, tag_id),
    CONSTRAINT product_tags_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
    CONSTRAINT product_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS public.orders (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    total_amount numeric NOT NULL,
    status public.order_status DEFAULT 'Pending'::public.order_status NOT NULL,
    shipping_details jsonb,
    order_number text NOT NULL,
    payment_method text,
    payment_details jsonb,
    coupon_code text,
    discount_amount numeric,
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT orders_order_number_key UNIQUE (order_number)
);
CREATE SEQUENCE IF NOT EXISTS public.orders_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;
ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    product_id bigint,
    quantity integer NOT NULL,
    price_at_purchase numeric NOT NULL,
    CONSTRAINT order_items_pkey PRIMARY KEY (id),
    CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL
);
CREATE SEQUENCE IF NOT EXISTS public.order_items_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;
ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);

-- The missing table
CREATE TABLE IF NOT EXISTS public.order_history (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    status public.order_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT order_history_pkey PRIMARY KEY (id),
    CONSTRAINT order_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);
CREATE SEQUENCE IF NOT EXISTS public.order_history_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.order_history_id_seq OWNED BY public.order_history.id;
ALTER TABLE ONLY public.order_history ALTER COLUMN id SET DEFAULT nextval('public.order_history_id_seq'::regclass);


-- Re-create all other tables with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id bigint NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text,
  created_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'unread'
);
CREATE SEQUENCE IF NOT EXISTS public.contact_messages_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.contact_messages_id_seq OWNED BY public.contact_messages.id;
ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.reviews (
  id bigint NOT NULL,
  user_id uuid NOT NULL,
  product_id bigint NOT NULL,
  rating integer NOT NULL,
  text text,
  status text DEFAULT 'Pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT reviews_user_id_product_id_key UNIQUE (user_id, product_id)
);
CREATE SEQUENCE IF NOT EXISTS public.reviews_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;
ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


CREATE TABLE IF NOT EXISTS public.questions (
  id bigint NOT NULL,
  user_id uuid NOT NULL,
  product_id bigint NOT NULL,
  question_text text,
  answer_text text,
  status text DEFAULT 'Pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  answered_at timestamp with time zone,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT questions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);
CREATE SEQUENCE IF NOT EXISTS public.questions_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;
ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


CREATE TABLE IF NOT EXISTS public.wishlist (
  id bigint NOT NULL,
  user_id uuid NOT NULL,
  product_id bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wishlist_pkey PRIMARY KEY (id),
  CONSTRAINT wishlist_user_id_product_id_key UNIQUE (user_id, product_id),
  CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);
CREATE SEQUENCE IF NOT EXISTS public.wishlist_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.wishlist_id_seq OWNED BY public.wishlist.id;
ALTER TABLE ONLY public.wishlist ALTER COLUMN id SET DEFAULT nextval('public.wishlist_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.offers (
  id bigint NOT NULL,
  title text NOT NULL,
  subtitle text,
  code text NOT NULL,
  discount_percentage integer NOT NULL,
  status text DEFAULT 'active'::text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  image_url text,
  category_ids integer[],
  product_ids integer[],
  CONSTRAINT offers_pkey PRIMARY KEY (id),
  CONSTRAINT offers_code_key UNIQUE (code)
);
CREATE SEQUENCE IF NOT EXISTS public.offers_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.offers_id_seq OWNED BY public.offers.id;
ALTER TABLE ONLY public.offers ALTER COLUMN id SET DEFAULT nextval('public.offers_id_seq'::regclass);


CREATE TABLE IF NOT EXISTS public.promos (
  id bigint NOT NULL,
  title text NOT NULL,
  subtitle text,
  button_text text,
  button_link text,
  status text DEFAULT 'active'::text,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT promos_pkey PRIMARY KEY (id)
);
CREATE SEQUENCE IF NOT EXISTS public.promos_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.promos_id_seq OWNED BY public.promos.id;
ALTER TABLE ONLY public.promos ALTER COLUMN id SET DEFAULT nextval('public.promos_id_seq'::regclass);


CREATE TABLE IF NOT EXISTS public.settings (
  key text NOT NULL,
  value text,
  CONSTRAINT settings_pkey PRIMARY KEY (key)
);


CREATE TABLE IF NOT EXISTS public.pages (
  id bigint NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  content jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pages_pkey PRIMARY KEY (id),
  CONSTRAINT pages_slug_key UNIQUE (slug)
);
CREATE SEQUENCE IF NOT EXISTS public.pages_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.pages_id_seq OWNED BY public.pages.id;
ALTER TABLE ONLY public.pages ALTER COLUMN id SET DEFAULT nextval('public.pages_id_seq'::regclass);


CREATE TABLE IF NOT EXISTS public.addresses (
  id bigint NOT NULL,
  user_id uuid NOT NULL,
  title text,
  street_address text,
  city text,
  state text,
  zip text,
  country text,
  created_at timestamp with time zone DEFAULT now(),
  address_type text,
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE SEQUENCE IF NOT EXISTS public.addresses_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.addresses_id_seq OWNED BY public.addresses.id;
ALTER TABLE ONLY public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);


CREATE TABLE IF NOT EXISTS public.cards (
  id bigint NOT NULL,
  user_id uuid NOT NULL,
  card_type text,
  last4 text,
  expiry_month integer,
  expiry_year integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cards_pkey PRIMARY KEY (id),
  CONSTRAINT cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE SEQUENCE IF NOT EXISTS public.cards_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.cards_id_seq OWNED BY public.cards.id;
ALTER TABLE ONLY public.cards ALTER COLUMN id SET DEFAULT nextval('public.cards_id_seq'::regclass);


CREATE TABLE IF NOT EXISTS public.refunds (
  id bigint NOT NULL,
  order_id bigint NOT NULL,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  reason text,
  status text DEFAULT 'Pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT refunds_pkey PRIMARY KEY (id),
  CONSTRAINT refunds_order_id_key UNIQUE (order_id),
  CONSTRAINT refunds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT refunds_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE SEQUENCE IF NOT EXISTS public.refunds_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.refunds_id_seq OWNED BY public.refunds.id;
ALTER TABLE ONLY public.refunds ALTER COLUMN id SET DEFAULT nextval('public.refunds_id_seq'::regclass);


CREATE TABLE IF NOT EXISTS public.transactions (
  id bigint NOT NULL,
  order_id bigint NOT NULL,
  user_id uuid,
  amount numeric NOT NULL,
  payment_method text,
  transaction_details jsonb,
  status text DEFAULT 'Completed'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE SEQUENCE IF NOT EXISTS public.transactions_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;
ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


CREATE TABLE IF NOT EXISTS public.notifications (
  id bigint NOT NULL,
  user_id uuid,
  title text NOT NULL,
  message text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  type public.notification_type,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE SEQUENCE IF NOT EXISTS public.notifications_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;
ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


CREATE TABLE IF NOT EXISTS public.home_page_sections (
  id bigint NOT NULL,
  category_id bigint NOT NULL,
  display_order integer NOT NULL,
  CONSTRAINT home_page_sections_pkey PRIMARY KEY (id),
  CONSTRAINT home_page_sections_category_id_key UNIQUE (category_id),
  CONSTRAINT home_page_sections_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
);
CREATE SEQUENCE IF NOT EXISTS public.home_page_sections_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.home_page_sections_id_seq OWNED BY public.home_page_sections.id;
ALTER TABLE ONLY public.home_page_sections ALTER COLUMN id SET DEFAULT nextval('public.home_page_sections_id_seq'::regclass);


-- The trigger function
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.order_history (order_id, status)
    VALUES (NEW.id, NEW.status);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger itself
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();


-- Recreate all functions with CREATE OR REPLACE

CREATE OR REPLACE FUNCTION public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status DEFAULT 'Processing'::public.order_status)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id bigint;
  new_order_number text;
  item record;
  current_user_id uuid := auth.uid();
  new_transaction_id bigint;
BEGIN
  new_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || substr(md5(random()::text), 1, 6);

  INSERT INTO public.orders (user_id, total_amount, shipping_details, order_number, payment_method, coupon_code, discount_amount, status)
  VALUES (current_user_id, p_total_amount, p_shipping_details, new_order_number, p_payment_method, p_coupon_code, p_discount_amount, p_initial_status)
  RETURNING id INTO new_order_id;
  
  FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id bigint, quantity int, price numeric)
  LOOP
    INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (new_order_id, item.product_id, item.quantity, item.price);

    UPDATE public.products SET stock = stock - item.quantity WHERE id = item.product_id;
  END LOOP;
  
  IF p_payment_method != 'cod' AND p_initial_status != 'Failed' THEN
    INSERT INTO public.transactions (order_id, user_id, amount, payment_method, transaction_details, status)
    VALUES (new_order_id, current_user_id, p_total_amount, p_payment_method, p_transaction_details, 'Completed')
    RETURNING id INTO new_transaction_id;
  END IF;

  RETURN new_order_number;
END;
$$;


CREATE OR REPLACE FUNCTION public.update_order_status_and_log(p_order_id integer, p_new_status text)
RETURNS SETOF public.orders
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.orders
    SET status = p_new_status::public.order_status
    WHERE id = p_order_id;

    RETURN QUERY
    SELECT * FROM public.orders WHERE id = p_order_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'customer');
  RETURN new;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Add RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own addresses." ON public.addresses;
CREATE POLICY "Users can view their own addresses." ON public.addresses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own addresses." ON public.addresses;
CREATE POLICY "Users can insert their own addresses." ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own addresses." ON public.addresses;
CREATE POLICY "Users can delete their own addresses." ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- Other functions
CREATE OR REPLACE FUNCTION public.get_all_settings() RETURNS TABLE(site_title text, site_subtitle text, logo_url text, favicon_url text, link_preview_image_url text, meta_title text, meta_description text, meta_tags text, canonical_url text, og_title text, og_description text, enable_cod boolean, enable_mobile_banking boolean, enable_card_payment boolean, maintenance_mode boolean, maintenance_title text, maintenance_description text, maintenance_cover_image_url text, maintenance_end_date text, enable_promo_popup boolean, social_links jsonb, mobile_banking_number text, mobile_banking_options jsonb, shipping_cost numeric) LANGUAGE sql AS $$ SELECT ( SELECT value FROM public.settings WHERE key = 'site_title' ) AS site_title, ( SELECT value FROM public.settings WHERE key = 'site_subtitle' ) AS site_subtitle, ( SELECT value FROM public.settings WHERE key = 'logo_url' ) AS logo_url, ( SELECT value FROM public.settings WHERE key = 'favicon_url' ) AS favicon_url, ( SELECT value FROM public.settings WHERE key = 'link_preview_image_url' ) AS link_preview_image_url, ( SELECT value FROM public.settings WHERE key = 'meta_title' ) AS meta_title, ( SELECT value FROM public.settings WHERE key = 'meta_description' ) AS meta_description, ( SELECT value FROM public.settings WHERE key = 'meta_tags' ) AS meta_tags, ( SELECT value FROM public.settings WHERE key = 'canonical_url' ) AS canonical_url, ( SELECT value FROM public.settings WHERE key = 'og_title' ) AS og_title, ( SELECT value FROM public.settings WHERE key = 'og_description' ) AS og_description, ( SELECT value FROM public.settings WHERE key = 'enable_cod' )::boolean AS enable_cod, ( SELECT value FROM public.settings WHERE key = 'enable_mobile_banking' )::boolean AS enable_mobile_banking, ( SELECT value FROM public.settings WHERE key = 'enable_card_payment' )::boolean AS enable_card_payment, ( SELECT value FROM public.settings WHERE key = 'maintenance_mode' )::boolean AS maintenance_mode, ( SELECT value FROM public.settings WHERE key = 'maintenance_title' ) AS maintenance_title, ( SELECT value FROM public.settings WHERE key = 'maintenance_description' ) AS maintenance_description, ( SELECT value FROM public.settings WHERE key = 'maintenance_cover_image_url' ) AS maintenance_cover_image_url, ( SELECT value FROM public.settings WHERE key = 'maintenance_end_date' ) AS maintenance_end_date, ( SELECT value FROM public.settings WHERE key = 'enable_promo_popup' )::boolean AS enable_promo_popup, ( SELECT value::jsonb FROM public.settings WHERE key = 'social_links' ) AS social_links, ( SELECT value FROM public.settings WHERE key = 'mobile_banking_number' ) AS mobile_banking_number, ( SELECT value::jsonb FROM public.settings WHERE key = 'mobile_banking_options' ) AS mobile_banking_options, ( SELECT value::numeric FROM public.settings WHERE key = 'shipping_cost' ) AS shipping_cost; $$;
CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text) RETURNS TABLE(id bigint, order_number text, created_at timestamp with time zone, total_amount numeric, status public.order_status, shipping_details jsonb, coupon_code text, discount_amount numeric, payment_method text, transaction_details jsonb, profiles jsonb, order_items jsonb) LANGUAGE sql AS $$ SELECT o.id, o.order_number, o.created_at, o.total_amount, o.status, o.shipping_details, o.coupon_code, o.discount_amount, o.payment_method, t.transaction_details, jsonb_build_object( 'full_name', p.full_name, 'avatar_url', p.avatar_url ) AS profiles, jsonb_agg(jsonb_build_object( 'id', oi.id, 'quantity', oi.quantity, 'price_at_purchase', oi.price_at_purchase, 'products', jsonb_build_object('name', pr.name, 'featured_image_url', pr.featured_image_url) )) AS order_items FROM public.orders o LEFT JOIN public.profiles p ON o.user_id = p.id LEFT JOIN public.order_items oi ON o.id = oi.order_id LEFT JOIN public.products pr ON oi.product_id = pr.id LEFT JOIN public.transactions t ON o.id = t.order_id WHERE o.order_number = p_order_number GROUP BY o.id, p.full_name, p.avatar_url, t.transaction_details; $$;
CREATE OR REPLACE FUNCTION public.get_order_history(p_order_id bigint) RETURNS TABLE(status text, created_at timestamp with time zone) LANGUAGE sql AS $$ SELECT status::text, created_at FROM public.order_history WHERE order_id = p_order_id ORDER BY created_at ASC; $$;
CREATE OR REPLACE FUNCTION public.get_related_products(p_id integer, p_limit integer) RETURNS SETOF public.products LANGUAGE sql AS $$ SELECT p.* FROM products p JOIN product_categories pc1 ON p.id = pc1.product_id JOIN product_categories pc2 ON pc1.category_id = pc2.category_id WHERE pc2.product_id = p_id AND p.id != p_id GROUP BY p.id ORDER BY COUNT(*) DESC, p.view_count DESC LIMIT p_limit; $$;
CREATE OR REPLACE FUNCTION public.toggle_wishlist_item(p_user_id uuid, p_product_id integer) RETURNS jsonb LANGUAGE plpgsql AS $$ DECLARE wishlist_id BIGINT; item_status TEXT; BEGIN SELECT id INTO wishlist_id FROM public.wishlist WHERE user_id = p_user_id AND product_id = p_product_id; IF wishlist_id IS NOT NULL THEN DELETE FROM public.wishlist WHERE id = wishlist_id; item_status := 'removed'; ELSE INSERT INTO public.wishlist (user_id, product_id) VALUES (p_user_id, p_product_id); item_status := 'added'; END IF; RETURN jsonb_build_object('status', item_status); END; $$;
CREATE OR REPLACE FUNCTION public.update_home_sections(sections_data jsonb) RETURNS void LANGUAGE plpgsql AS $$ BEGIN DELETE FROM public.home_page_sections; INSERT INTO public.home_page_sections (category_id, display_order) SELECT (value->>'category_id')::bigint, (value->>'display_order')::integer FROM jsonb_array_elements(sections_data); END; $$;
