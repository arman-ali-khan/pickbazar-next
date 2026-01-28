-- Pickbazar initial database schema
-- This script is idempotent and can be run multiple times safely.

-- ----------------------------------------------------------------
-- EXTENSIONS
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
END$$;


DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'customer',
            'manager',
            'admin',
            'super-admin'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'address_type') THEN
        CREATE TYPE public.address_type AS ENUM (
            'billing',
            'shipping'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
      CREATE TYPE public.notification_type AS ENUM (
          'new_order',
          'order_update',
          'new_review',
          'new_question',
          'question_answered',
          'new_refund',
          'refund_update',
          'role_update',
          'promotion',
          'security',
          'review_request',
          'new_message'
      );
    END IF;
END$$;


-- ----------------------------------------------------------------
-- SEQUENCES
-- ----------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ----------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    bio text,
    contact_number text,
    role user_role DEFAULT 'customer'::user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.addresses (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    address_type address_type NOT NULL,
    title text NOT NULL,
    country text,
    city text,
    state text,
    zip text,
    street_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT addresses_pkey PRIMARY KEY (id),
    CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
CREATE SEQUENCE IF NOT EXISTS public.addresses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.categories (
    id bigint NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    icon text,
    description text,
    parent_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_slug_key UNIQUE (slug),
    CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL
);
CREATE SEQUENCE IF NOT EXISTS public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.tags (
    id bigint NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tags_pkey PRIMARY KEY (id),
    CONSTRAINT tags_slug_key UNIQUE (slug)
);
CREATE SEQUENCE IF NOT EXISTS public.tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.products (
    id bigint NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    featured_image_url text,
    gallery_urls text[],
    price double precision DEFAULT 0 NOT NULL,
    original_price double precision,
    stock integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    unit text,
    view_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_pkey PRIMARY KEY (id),
    CONSTRAINT products_slug_key UNIQUE (slug)
);
CREATE SEQUENCE IF NOT EXISTS public.products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);

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

CREATE TABLE IF NOT EXISTS public.reviews (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    rating integer NOT NULL,
    text text,
    status text DEFAULT 'Pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_pkey PRIMARY KEY (id),
    CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
    CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT reviews_user_id_product_id_key UNIQUE (user_id, product_id),
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);
CREATE SEQUENCE IF NOT EXISTS public.reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.questions (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    question_text text NOT NULL,
    answer_text text,
    status text DEFAULT 'Pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    answered_at timestamp with time zone,
    CONSTRAINT questions_pkey PRIMARY KEY (id),
    CONSTRAINT questions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
    CONSTRAINT questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
CREATE SEQUENCE IF NOT EXISTS public.questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.wishlist (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT wishlist_pkey PRIMARY KEY (id),
    CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
    CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT wishlist_user_id_product_id_key UNIQUE (user_id, product_id)
);
CREATE SEQUENCE IF NOT EXISTS public.wishlist_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.wishlist ALTER COLUMN id SET DEFAULT nextval('public.wishlist_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.orders (
    id bigint NOT NULL,
    user_id uuid,
    order_number text DEFAULT ('KB-'::text || nextval('public.order_number_seq'::regclass)) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status order_status DEFAULT 'Pending'::order_status NOT NULL,
    shipping_details jsonb,
    payment_method text,
    payment_details jsonb,
    coupon_code text,
    discount_amount numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT orders_order_number_key UNIQUE (order_number),
    CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);
CREATE SEQUENCE IF NOT EXISTS public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    product_id bigint NOT NULL,
    quantity integer NOT NULL,
    price_at_purchase numeric(10,2) NOT NULL,
    CONSTRAINT order_items_pkey PRIMARY KEY (id),
    CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT
);
CREATE SEQUENCE IF NOT EXISTS public.order_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.order_history (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    status order_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT order_history_pkey PRIMARY KEY (id),
    CONSTRAINT order_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);
CREATE SEQUENCE IF NOT EXISTS public.order_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.order_history ALTER COLUMN id SET DEFAULT nextval('public.order_history_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint NOT NULL,
    user_id uuid,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false NOT NULL,
    type notification_type,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
CREATE SEQUENCE IF NOT EXISTS public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.refunds (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'Pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT refunds_pkey PRIMARY KEY (id),
    CONSTRAINT refunds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    CONSTRAINT refunds_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
CREATE SEQUENCE IF NOT EXISTS public.refunds_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.refunds ALTER COLUMN id SET DEFAULT nextval('public.refunds_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL,
    value text,
    CONSTRAINT settings_pkey PRIMARY KEY (key)
);

CREATE TABLE IF NOT EXISTS public.offers (
    id bigint NOT NULL,
    title text NOT NULL,
    subtitle text,
    code text NOT NULL,
    discount_percentage numeric(5,2) NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    status text DEFAULT 'inactive'::text NOT NULL,
    image_url text,
    product_ids integer[],
    category_ids integer[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT offers_pkey PRIMARY KEY (id),
    CONSTRAINT offers_code_key UNIQUE (code)
);
CREATE SEQUENCE IF NOT EXISTS public.offers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.offers ALTER COLUMN id SET DEFAULT nextval('public.offers_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id bigint NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'unread'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
);
CREATE SEQUENCE IF NOT EXISTS public.contact_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.pages (
    slug text NOT NULL,
    title text NOT NULL,
    content jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pages_pkey PRIMARY KEY (slug)
);

CREATE TABLE IF NOT EXISTS public.promos (
    id bigint NOT NULL,
    title text NOT NULL,
    subtitle text,
    button_text text,
    button_link text,
    image_url text,
    status text DEFAULT 'inactive'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT promos_pkey PRIMARY KEY (id)
);
CREATE SEQUENCE IF NOT EXISTS public.promos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.promos ALTER COLUMN id SET DEFAULT nextval('public.promos_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.home_page_sections (
    id bigint NOT NULL,
    category_id bigint NOT NULL,
    display_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT home_page_sections_pkey PRIMARY KEY (id),
    CONSTRAINT home_page_sections_category_id_key UNIQUE (category_id),
    CONSTRAINT home_page_sections_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
);
CREATE SEQUENCE IF NOT EXISTS public.home_page_sections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.home_page_sections ALTER COLUMN id SET DEFAULT nextval('public.home_page_sections_id_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.cards (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    card_type text NOT NULL,
    last4 text NOT NULL,
    expiry_month integer NOT NULL,
    expiry_year integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cards_pkey PRIMARY KEY (id),
    CONSTRAINT cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
CREATE SEQUENCE IF NOT EXISTS public.cards_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.cards ALTER COLUMN id SET DEFAULT nextval('public.cards_id_seq'::regclass);


-- ----------------------------------------------------------------
-- RLS POLICIES
-- ----------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
CREATE POLICY "Enable read access for all users" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable update for users for their own profile" ON public.profiles;
CREATE POLICY "Enable update for users for their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable full access for users based on user_id" ON public.addresses;
CREATE POLICY "Enable full access for users based on user_id" ON public.addresses FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.categories;
CREATE POLICY "Enable read access for all users" ON public.categories FOR SELECT USING (true);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tags;
CREATE POLICY "Enable read access for all users" ON public.tags FOR SELECT USING (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_categories;
CREATE POLICY "Enable read access for all users" ON public.product_categories FOR SELECT USING (true);

ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_tags;
CREATE POLICY "Enable read access for all users" ON public.product_tags FOR SELECT USING (true);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reviews;
CREATE POLICY "Enable read access for all users" ON public.reviews FOR SELECT USING (status = 'Approved');
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.reviews;
CREATE POLICY "Enable insert for authenticated users" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Enable update for users for their own reviews" ON public.reviews;
CREATE POLICY "Enable update for users for their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.questions;
CREATE POLICY "Enable read access for all users" ON public.questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.questions;
CREATE POLICY "Enable insert for authenticated users" ON public.questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable full access for users based on user_id" ON public.wishlist;
CREATE POLICY "Enable full access for users based on user_id" ON public.wishlist FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for owner and admins" ON public.orders;
CREATE POLICY "Enable read access for owner and admins" ON public.orders FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super-admin'));
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.orders;
CREATE POLICY "Enable insert for authenticated users" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all access for admins" ON public.orders;
CREATE POLICY "Allow all access for admins" ON public.orders FOR ALL TO authenticated USING ((get_my_claim('user_role'::text))::text = '"admin"'::text) WITH CHECK ((get_my_claim('user_role'::text))::text = '"admin"'::text);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access based on order ownership" ON public.order_items;
CREATE POLICY "Enable read access based on order ownership" ON public.order_items FOR SELECT USING (
    (SELECT user_id FROM public.orders WHERE id = order_id) = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super-admin')
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for owner and admins" ON public.notifications;
CREATE POLICY "Enable read for owner and admins" ON public.notifications FOR SELECT USING (user_id IS NULL OR user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super-admin'));
DROP POLICY IF EXISTS "Enable update for owner" ON public.notifications;
CREATE POLICY "Enable update for owner" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable full access for owner and admins" ON public.refunds;
CREATE POLICY "Enable full access for owner and admins" ON public.refunds FOR ALL USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super-admin'));
DROP POLICY IF EXISTS "Users can only delete their own PENDING refunds" ON public.refunds;
CREATE POLICY "Users can only delete their own PENDING refunds" ON public.refunds FOR DELETE USING (auth.uid() = user_id AND status = 'Pending');

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to all" ON public.settings;
CREATE POLICY "Allow read access to all" ON public.settings FOR SELECT USING (true);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to all" ON public.offers;
CREATE POLICY "Allow read access to all" ON public.offers FOR SELECT USING (true);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert for all users" ON public.contact_messages;
CREATE POLICY "Allow insert for all users" ON public.contact_messages FOR INSERT WITH CHECK (true);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to all" ON public.pages;
CREATE POLICY "Allow read access to all" ON public.pages FOR SELECT USING (true);

ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access for active promos to all" ON public.promos;
CREATE POLICY "Allow read access for active promos to all" ON public.promos FOR SELECT USING (status = 'active');

ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to all" ON public.home_page_sections;
CREATE POLICY "Allow read access to all" ON public.home_page_sections FOR SELECT USING (true);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable full access for users based on user_id" ON public.cards;
CREATE POLICY "Enable full access for users based on user_id" ON public.cards FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access based on order ownership" ON public.order_history;
CREATE POLICY "Enable read access based on order ownership" ON public.order_history FOR SELECT USING (
    (SELECT user_id FROM public.orders WHERE id = order_id) = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super-admin')
);


-- ----------------------------------------------------------------
-- FUNCTIONS AND TRIGGERS
-- ----------------------------------------------------------------

-- Function to create a public profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle custom claims
CREATE OR REPLACE FUNCTION public.get_my_claim(claim TEXT)
RETURNS JSONB
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::JSONB ->> claim,
    (SELECT raw_user_meta_data->>claim FROM auth.users WHERE id = auth.uid())
  )::JSONB
$$;

-- Function to log order status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log only if the status has actually changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_history (order_id, status)
    VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for order status changes
DROP TRIGGER IF EXISTS log_order_status_change_trigger ON public.orders;
CREATE TRIGGER log_order_status_change_trigger
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();


-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tags_updated_at ON public.tags;
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pages_updated_at ON public.pages;
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create a new order
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
    INSERT INTO public.orders (
        user_id, total_amount, shipping_details, payment_method, 
        payment_details, coupon_code, discount_amount, status
    )
    VALUES (
        auth.uid(), p_total_amount, p_shipping_details, p_payment_method, 
        p_transaction_details, p_coupon_code, p_discount_amount, p_initial_status
    )
    RETURNING id, order_number INTO new_order_id, new_order_number;

    -- Insert into order history
    INSERT INTO public.order_history (order_id, status)
    VALUES (new_order_id, p_initial_status);

    -- Insert items into order_items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (
            new_order_id,
            (item->>'product_id')::bigint,
            (item->>'quantity')::integer,
            (item->>'price')::numeric
        );

        -- Decrement stock
        UPDATE public.products
        SET stock = stock - (item->>'quantity')::integer
        WHERE id = (item->>'product_id')::bigint;
    END LOOP;

    RETURN new_order_number;
END;
$$;
-- Function to update order status and log it
DROP FUNCTION IF EXISTS public.update_order_status_and_log(bigint, public.order_status);
CREATE OR REPLACE FUNCTION public.update_order_status_and_log(
    p_order_id bigint,
    p_new_status public.order_status
)
RETURNS TABLE (
    order_id bigint,
    order_number text,
    user_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.orders
    SET status = p_new_status
    WHERE id = p_order_id;
    
    RETURN QUERY
    SELECT o.id, o.order_number, o.user_id FROM public.orders o WHERE o.id = p_order_id;
END;
$$;
-- Increment product view count
CREATE OR REPLACE FUNCTION public.increment_product_view(product_id_to_inc integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.products
  SET view_count = view_count + 1
  WHERE id = product_id_to_inc;
$$;

-- Toggle wishlist item
CREATE OR REPLACE FUNCTION public.toggle_wishlist_item(p_user_id uuid, p_product_id integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wishlist_id bigint;
  v_status text;
BEGIN
  SELECT id INTO v_wishlist_id
  FROM public.wishlist
  WHERE user_id = p_user_id AND product_id = p_product_id;

  IF v_wishlist_id IS NOT NULL THEN
    DELETE FROM public.wishlist WHERE id = v_wishlist_id;
    v_status := 'removed';
  ELSE
    INSERT INTO public.wishlist (user_id, product_id)
    VALUES (p_user_id, p_product_id);
    v_status := 'added';
  END IF;

  RETURN json_build_object('status', v_status);
END;
$$;

-- Get user wishlist IDs
CREATE OR REPLACE FUNCTION public.get_user_wishlist_ids(p_user_id uuid)
RETURNS TABLE(product_id integer)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT w.product_id::integer FROM public.wishlist w WHERE w.user_id = p_user_id;
END;
$$;


-- ----------------------------------------------------------------
-- DATABASE VIEWS AND RPCs
-- ----------------------------------------------------------------
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
BEGIN
    RETURN QUERY
    WITH scored_products AS (
        -- Calculate relevance score based on shared categories and tags
        SELECT
            p.id,
            (
                (SELECT COUNT(*) FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id IN (SELECT category_id FROM product_categories WHERE product_id = p_id)) * 2 +
                (SELECT COUNT(*) FROM product_tags pt WHERE pt.product_id = p.id AND pt.tag_id IN (SELECT tag_id FROM product_tags WHERE product_id = p_id))
            ) as relevance_score
        FROM products p
        WHERE p.id != p_id AND p.status = 'active'
    ),
    ranked_products AS (
        -- Rank products by relevance score, then by view_count as a tie-breaker
        SELECT
            p.id,
            p.name,
            p.price,
            p.original_price,
            p.featured_image_url,
            p.unit,
            sp.relevance_score,
            -- Prioritize scored products over fallback products
            CASE WHEN sp.relevance_score > 0 THEN 1 ELSE 2 END as priority
        FROM products p
        JOIN scored_products sp ON p.id = sp.id
    )
    -- Final selection and ordering
    SELECT
        rp.id,
        rp.name,
        rp.price,
        rp.original_price,
        rp.featured_image_url,
        rp.unit
    FROM ranked_products rp
    ORDER BY
        rp.priority, -- Show scored products first
        rp.relevance_score DESC,
        (SELECT view_count FROM products WHERE id = rp.id) DESC NULLS LAST, -- Then by views
        (SELECT created_at FROM products WHERE id = rp.id) DESC -- Then by creation date
    LIMIT p_limit;
END;
$$;


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
BEGIN
    RETURN QUERY
    WITH product_scores AS (
        SELECT
            p.id,
            p.created_at,
            COALESCE(p.view_count, 0) as views,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) as sales_count,
            (SELECT COUNT(*) FROM wishlist w WHERE w.product_id = p.id) as wishlist_count
        FROM
            products p
        WHERE p.status = 'active'
    )
    SELECT
        p.id,
        p.name,
        p.price,
        p.original_price,
        p.featured_image_url,
        p.unit
    FROM
        products p
    JOIN product_scores ps ON p.id = ps.id
    ORDER BY
        -- Weighted score: Sales (50%), Wishlists (30%), Views (20%)
        (ps.sales_count * 0.5) + (ps.wishlist_count * 0.3) + (ps.views * 0.2) DESC,
        ps.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Function to get category tree
CREATE OR REPLACE FUNCTION get_category_tree()
RETURNS json
LANGUAGE sql
AS $$
  SELECT json_agg(parent_cat)
  FROM (
    SELECT
      c.name,
      (SELECT json_agg(sub_cat.name)
       FROM categories sub_cat
       WHERE sub_cat.parent_id = c.id
      ) as subcategories
    FROM categories c
    WHERE c.parent_id IS NULL
    ORDER BY c.name
  ) parent_cat;
$$;

-- Function to get all settings as a single JSON object
CREATE OR REPLACE FUNCTION get_all_settings()
RETURNS json
LANGUAGE sql
AS $$
  SELECT json_agg(s) FROM (SELECT * FROM settings) s;
$$;


-- Function to get admin notifications (user_id is NULL)
CREATE OR REPLACE FUNCTION get_admin_notifications()
RETURNS TABLE (
    id bigint,
    title text,
    message text,
    link text,
    is_read boolean,
    created_at timestamp with time zone,
    type notification_type
)
LANGUAGE sql
AS $$
    SELECT id, title, message, link, is_read, created_at, type
    FROM public.notifications
    WHERE user_id IS NULL
    ORDER BY created_at DESC;
$$;

-- Function to get reviews with author and product info for admin
CREATE OR REPLACE FUNCTION get_admin_reviews()
RETURNS TABLE (
    id bigint,
    rating integer,
    text text,
    status text,
    created_at timestamp with time zone,
    author jsonb,
    product jsonb
)
LANGUAGE sql
AS $$
    SELECT
        r.id,
        r.rating,
        r.text,
        r.status,
        r.created_at,
        jsonb_build_object(
            'name', pr.full_name,
            'avatar_url', pr.avatar_url
        ),
        jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'featured_image_url', p.featured_image_url
        )
    FROM
        reviews r
    JOIN
        profiles pr ON r.user_id = pr.id
    JOIN
        products p ON r.product_id = p.id
    ORDER BY
        r.created_at DESC;
$$;

-- Function to get user-submitted reviews
CREATE OR REPLACE FUNCTION get_user_reviews(p_user_id uuid)
RETURNS TABLE (
    id bigint,
    rating integer,
    text text,
    status text,
    created_at timestamp with time zone,
    product_name text,
    product_image text,
    product_id bigint
)
LANGUAGE sql
AS $$
    SELECT
        r.id,
        r.rating,
        r.text,
        r.status,
        r.created_at,
        p.name AS product_name,
        p.featured_image_url AS product_image,
        p.id AS product_id
    FROM
        reviews r
    JOIN
        products p ON r.product_id = p.id
    WHERE
        r.user_id = p_user_id
    ORDER BY
        r.created_at DESC;
$$;

-- Function to get questions for admin panel
CREATE OR REPLACE FUNCTION get_admin_questions()
RETURNS TABLE (
    id bigint,
    question text,
    answer text,
    status text,
    date timestamp with time zone,
    author jsonb,
    product jsonb
)
LANGUAGE sql
AS $$
    SELECT
        q.id,
        q.question_text AS question,
        q.answer_text AS answer,
        q.status,
        q.created_at AS date,
        jsonb_build_object(
            'name', pr.full_name,
            'avatar', jsonb_build_object(
                'imageUrl', pr.avatar_url,
                'imageHint', 'user avatar'
            )
        ) AS author,
        jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'image', jsonb_build_object(
                'imageUrl', p.featured_image_url,
                'imageHint', 'product image'
            )
        ) AS product
    FROM
        questions q
    JOIN
        profiles pr ON q.user_id = pr.id
    JOIN
        products p ON q.product_id = p.id
    ORDER BY
        q.created_at DESC;
$$;
CREATE OR REPLACE FUNCTION get_admin_question_details(p_question_id bigint)
RETURNS TABLE (
    id bigint,
    question text,
    answer text,
    status text,
    date timestamp with time zone,
    author jsonb,
    product jsonb
)
LANGUAGE sql
AS $$
    SELECT
        q.id,
        q.question_text AS question,
        q.answer_text AS answer,
        q.status,
        q.created_at AS date,
        jsonb_build_object(
            'name', pr.full_name,
            'avatar', jsonb_build_object(
                'imageUrl', pr.avatar_url,
                'imageHint', 'user avatar'
            )
        ) AS author,
        jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'image', jsonb_build_object(
                'imageUrl', p.featured_image_url,
                'imageHint', 'product image'
            )
        ) AS product
    FROM
        questions q
    JOIN
        profiles pr ON q.user_id = pr.id
    JOIN
        products p ON q.product_id = p.id
    WHERE q.id = p_question_id;
$$;


-- Function to get user-submitted questions
CREATE OR REPLACE FUNCTION get_user_questions(p_user_id uuid)
RETURNS TABLE (
    id bigint,
    question_text text,
    answer_text text,
    status text,
    created_at timestamp with time zone,
    product_name text,
    product_id bigint,
    product_image text
)
LANGUAGE sql
AS $$
    SELECT
        q.id,
        q.question_text,
        q.answer_text,
        q.status,
        q.created_at,
        p.name as product_name,
        p.id as product_id,
        p.featured_image_url as product_image
    FROM
        questions q
    JOIN
        products p ON q.product_id = p.id
    WHERE
        q.user_id = p_user_id
    ORDER BY
        q.created_at DESC;
$$;


-- Function to get admin refunds list
CREATE OR REPLACE FUNCTION get_admin_refunds()
RETURNS TABLE (
    id bigint,
    order_id bigint,
    order_number text,
    amount numeric,
    status text,
    reason text,
    created_at timestamp with time zone,
    user_id uuid,
    customer_name text,
    customer_avatar_url text
)
LANGUAGE sql
AS $$
    SELECT
        r.id,
        r.order_id,
        o.order_number,
        r.amount,
        r.status,
        r.reason,
        r.created_at,
        r.user_id,
        p.full_name as customer_name,
        p.avatar_url as customer_avatar_url
    FROM
        refunds r
    JOIN
        orders o ON r.order_id = o.id
    JOIN
        profiles p ON r.user_id = p.id
    ORDER BY
        r.created_at DESC;
$$;

-- Function to get user refunds list
CREATE OR REPLACE FUNCTION get_user_refunds(p_user_id uuid)
RETURNS TABLE (
    id bigint,
    order_id bigint,
    order_number text,
    amount numeric,
    status text,
    reason text,
    created_at timestamp with time zone
)
LANGUAGE sql
AS $$
    SELECT
        r.id,
        r.order_id,
        o.order_number,
        r.amount,
        r.status,
        r.reason,
        r.created_at
    FROM
        refunds r
    JOIN
        orders o ON r.order_id = o.id
    WHERE
        r.user_id = p_user_id
    ORDER BY
        r.created_at DESC;
$$;

-- Function to get user transactions
CREATE OR REPLACE FUNCTION get_user_transactions(p_user_id uuid)
RETURNS TABLE (
    id bigint,
    order_id bigint,
    order_number text,
    amount numeric,
    payment_method text,
    status text,
    created_at timestamp with time zone
)
LANGUAGE sql
AS $$
    SELECT
        o.id,
        o.id as order_id,
        o.order_number,
        o.total_amount as amount,
        o.payment_method,
        CASE
            WHEN o.status = 'Delivered' OR o.status = 'Processing' OR o.status = 'Shipped' THEN 'Completed'
            WHEN o.status = 'Cancelled' OR o.status = 'Failed' THEN 'Failed'
            ELSE 'Pending'
        END as status,
        o.created_at
    FROM
        orders o
    WHERE
        o.user_id = p_user_id
    ORDER BY
        o.created_at DESC;
$$;

-- Function to get all users for admin
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    created_at timestamp with time zone,
    role user_role
)
LANGUAGE sql
AS $$
    SELECT
        u.id,
        p.full_name,
        u.email,
        p.avatar_url,
        u.created_at,
        p.role
    FROM
        auth.users u
    LEFT JOIN
        public.profiles p ON u.id = p.id
    ORDER BY u.created_at DESC;
$$;

-- Function to get admin order list
CREATE OR REPLACE FUNCTION get_admin_order_list()
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount numeric,
    status order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
LANGUAGE sql
AS $$
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        p.full_name AS customer_name,
        (o.shipping_details->>'email')::text AS customer_email,
        p.avatar_url AS customer_avatar_url
    FROM
        orders o
    LEFT JOIN
        profiles p ON o.user_id = p.id
    ORDER BY
        o.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount numeric,
    status order_status,
    shipping_details jsonb,
    profiles jsonb,
    order_items jsonb,
    coupon_code text,
    discount_amount numeric,
    payment_method text,
    transaction_details jsonb
)
LANGUAGE sql
AS $$
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        o.shipping_details,
        (SELECT jsonb_build_object(
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ) FROM profiles p WHERE p.id = o.user_id) AS profiles,
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', oi.id,
                'quantity', oi.quantity,
                'price_at_purchase', oi.price_at_purchase,
                'products', (SELECT jsonb_build_object(
                    'name', pr.name,
                    'featured_image_url', pr.featured_image_url
                ) FROM products pr WHERE pr.id = oi.product_id)
            )
        ) FROM order_items oi WHERE oi.order_id = o.id) AS order_items,
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.payment_details AS transaction_details
    FROM
        orders o
    WHERE
        o.order_number = p_order_number;
$$;


CREATE OR REPLACE FUNCTION get_contact_messages()
RETURNS TABLE(
    id bigint,
    senderName text,
    senderEmail text,
    subject text,
    message text,
    date text,
    status text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.name,
        cm.email,
        cm.subject,
        cm.message,
        cm.created_at::text,
        cm.status
    FROM 
        public.contact_messages cm
    ORDER BY 
        cm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_contact_message_details(p_message_id bigint)
RETURNS TABLE(
    id bigint,
    senderName text,
    senderEmail text,
    subject text,
    message text,
    date text,
    status text,
    avatar jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.name,
        cm.email,
        cm.subject,
        cm.message,
        cm.created_at::text,
        cm.status,
        jsonb_build_object(
            'imageUrl', null,
            'imageHint', 'user initial'
        )
    FROM 
        public.contact_messages cm
    WHERE
        cm.id = p_message_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_home_sections(sections_data jsonb)
RETURNS void AS $$
BEGIN
    -- First, remove all existing sections
    DELETE FROM public.home_page_sections;

    -- Then, insert the new sections from the JSON data
    INSERT INTO public.home_page_sections (category_id, display_order)
    SELECT
        (section->>'category_id')::bigint,
        (section->>'display_order')::int
    FROM jsonb_array_elements(sections_data) AS section;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_order_history(p_order_id bigint)
RETURNS TABLE(status text, created_at timestamp with time zone) AS $$
BEGIN
    RETURN QUERY 
    SELECT oh.status::text, oh.created_at 
    FROM public.order_history oh
    WHERE oh.order_id = p_order_id
    ORDER BY oh.created_at ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_product_reviews(p_product_id bigint)
RETURNS TABLE(
    id bigint,
    rating integer,
    text text,
    created_at timestamp with time zone,
    author_name text,
    author_avatar text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.rating,
        r.text,
        r.created_at,
        p.full_name,
        p.avatar_url
    FROM public.reviews r
    JOIN public.profiles p ON r.user_id = p.id
    WHERE r.product_id = p_product_id AND r.status = 'Approved'
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_product_rating_stats(p_product_id bigint)
RETURNS TABLE(
    total_reviews bigint,
    avg_rating numeric,
    rating_distribution jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_reviews,
        AVG(r.rating) as avg_rating,
        (
            SELECT jsonb_agg(t)
            FROM (
                SELECT 
                    stars.rating,
                    COUNT(r.rating) as count
                FROM (
                    SELECT generate_series(1,5) AS rating
                ) as stars
                LEFT JOIN public.reviews r ON stars.rating = r.rating AND r.product_id = p_product_id AND r.status = 'Approved'
                GROUP BY stars.rating
                ORDER BY stars.rating ASC
            ) t
        ) as rating_distribution
    FROM public.reviews r
    WHERE r.product_id = p_product_id AND r.status = 'Approved';
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_product_questions(p_product_id bigint)
RETURNS TABLE(
    id bigint,
    question_text text,
    answer_text text,
    created_at timestamp with time zone,
    author_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.question_text,
        q.answer_text,
        q.created_at,
        p.full_name
    FROM public.questions q
    JOIN public.profiles p ON q.user_id = p.id
    WHERE q.product_id = p_product_id AND q.status = 'Answered'
    ORDER BY q.created_at DESC;
END;
$$ LANGUAGE plpgsql;



-- ----------------------------------------------------------------
-- INITIAL DATA SEEDING (Idempotent)
-- ----------------------------------------------------------------
INSERT INTO public.pages (slug, title, content)
VALUES
    ('about', 'About Us', '{"title": "Serving You Freshness Every Day", "subtitle": "We are a team of food lovers who are passionate about bringing the freshest and highest quality products right to your doorstep.", "missionTitle": "Our Mission", "missionText": "<p>Our mission is simple: to provide our community with convenient access to fresh, healthy, and delicious food. We partner with local farmers and trusted suppliers to ensure that every item in our store meets our high standards of quality and freshness.</p>", "teamTitle": "Meet Our Team", "team": [{"name": "John Doe", "role": "CEO & Founder", "bio": "<p>John is the visionary behind Pickbazar, with a passion for quality food and customer satisfaction.</p>"}, {"name": "Jane Smith", "role": "Head of Operations", "bio": "<p>Jane ensures that our daily operations run smoothly, from procurement to delivery.</p>"}, {"name": "Peter Jones", "role": "Lead Developer", "bio": "<p>Peter is the mastermind behind our user-friendly platform, making grocery shopping a breeze.</p>"}]}')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.pages (slug, title, content)
VALUES
    ('contact', 'Contact Us', '{"address": "123 Green Grocer Lane, Farmville, FS 54321", "email": "support@pickbazar.com", "phone": "+1 (555) 123-4567"}')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.pages (slug, title, content)
VALUES
    ('faq', 'Frequently Asked Questions', '{"faqs": [{"question": "How does the delivery process work?", "answer": "We offer delivery within 90 minutes for most locations. Once you place an order, our system assigns it to the nearest delivery partner. You will receive a notification once your order is out for delivery."}, {"question": "What are the payment methods available?", "answer": "We accept all major credit and debit cards, as well as digital wallets like Apple Pay and Google Pay. Cash on Delivery (COD) is also available for select orders."}, {"question": "What is your return policy?", "answer": "We have a no-questions-asked return policy for most items within 24 hours of delivery, provided the items are in their original packaging and condition. Please check the item description for specific return information."}, {"question": "How do I track my order?", "answer": "You can track your order in real-time from the ''My Orders'' section of your account. You will also receive SMS and email updates at every stage of your order."}]}')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.pages (slug, title, content)
VALUES
    ('privacy-policy', 'Privacy Policy', '{"html": "<h2>1. Information We Collect</h2><p>We collect information you provide directly to us, such as when you create an account, place an order, or contact customer support.</p><h2>2. How We Use Your Information</h2><p>We use the information we collect to provide, maintain, and improve our services, including to process transactions, send notifications, and personalize your experience.</p><h2>3. Information Sharing</h2><p>We do not share your personal information with third parties except as necessary to provide our services or as required by law.</p>"}')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.pages (slug, title, content)
VALUES
    ('terms-and-conditions', 'Terms & Conditions', '{"html": "<h2>1. Agreement to Terms</h2><p>By using our services, you agree to be bound by these Terms. If you don’t agree to be bound by these Terms, do not use the services.</p><h2>2. Changes to Terms or Services</h2><p>We may update the Terms at any time, in our sole discretion. If we do so, we’ll let you know either by posting the updated Terms on the Site or through other communications.</p><h2>3. Who May Use the Services</h2><p>You may use the Services only if you are 18 years or older and are not barred from using the Services under applicable law.</p>"}')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.settings (key, value)
VALUES
    ('site_title', 'Pickbazar'),
    ('site_subtitle', 'Your one-stop shop for fresh, high-quality groceries delivered to your door.'),
    ('canonical_url', 'https://www.pickbazar.com'),
    ('enable_cod', 'true'),
    ('enable_mobile_banking', 'true'),
    ('enable_card_payment', 'false'),
    ('maintenance_mode', 'false'),
    ('maintenance_title', 'We''ll be back soon!'),
    ('maintenance_description', 'Sorry for the inconvenience, but we''re performing some maintenance at the moment. We''ll be back online shortly!'),
    ('enable_promo_popup', 'true'),
    ('shipping_cost', '5.00'),
    ('mobile_banking_number', '01234567890'),
    ('mobile_banking_options', '["bKash", "Nagad"]'),
    ('social_links', '[{"url": "https://facebook.com", "icon": "Facebook"}, {"url": "https://twitter.com", "icon": "Twitter"}, {"url": "https://instagram.com", "icon": "Instagram"}]')
ON CONFLICT (key) DO NOTHING;

    