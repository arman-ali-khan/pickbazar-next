
-- Drop conflicting functions first to ensure a clean slate
DROP FUNCTION IF EXISTS public.create_order(numeric,jsonb,jsonb,text,jsonb,text,numeric);
DROP FUNCTION IF EXISTS public.create_order(numeric,jsonb,jsonb,text,jsonb,text,numeric,text);
DROP FUNCTION IF EXISTS public.create_order(numeric,jsonb,jsonb,text,jsonb,text,numeric,public.order_status);

-- =================================================================
-- 1. TYPES
-- =================================================================

-- Ensure order_status enum type exists
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

-- Ensure user_role enum type exists
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


-- =================================================================
-- 2. TABLES
-- =================================================================

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    bio text,
    contact_number text,
    role public.user_role DEFAULT 'customer'::public.user_role,
    created_at timestamp with time zone DEFAULT now()
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id bigint NOT NULL PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    unit text,
    price numeric(10,2) NOT NULL,
    original_price numeric(10,2),
    stock integer DEFAULT 0,
    status text DEFAULT 'draft'::text,
    featured_image_url text,
    gallery_urls text[],
    view_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.products_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id bigint NOT NULL PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    parent_id bigint REFERENCES public.categories(id),
    icon text,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.categories_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


-- Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
    id bigint NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.tags_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);

-- Product_Categories Junction Table
CREATE TABLE IF NOT EXISTS public.product_categories (
    product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    category_id bigint NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- Product_Tags Junction Table
CREATE TABLE IF NOT EXISTS public.product_tags (
    product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    tag_id bigint NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id bigint NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text text,
    status text DEFAULT 'Pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, product_id)
);
CREATE SEQUENCE IF NOT EXISTS public.reviews_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);

-- Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
    id bigint NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    answer_text text,
    status text DEFAULT 'Pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    answered_at timestamp with time zone
);
CREATE SEQUENCE IF NOT EXISTS public.questions_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);

-- Addresses Table
CREATE TABLE IF NOT EXISTS public.addresses (
    id bigint NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    address_type text,
    title text NOT NULL,
    country text,
    city text,
    state text,
    zip text,
    street_address text,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.addresses_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id bigint NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    order_number text NOT NULL UNIQUE,
    total_amount numeric(10,2) NOT NULL,
    status public.order_status NOT NULL,
    shipping_details jsonb,
    coupon_code text,
    discount_amount numeric(10,2),
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.orders_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);

-- Order_Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint NOT NULL PRIMARY KEY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id bigint NOT NULL REFERENCES public.products(id),
    quantity integer NOT NULL,
    price_at_purchase numeric(10,2) NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS public.order_items_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id bigint NOT NULL PRIMARY KEY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    amount numeric(10,2) NOT NULL,
    payment_method text,
    transaction_details jsonb,
    status text,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.transactions_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


-- Wishlist Table
CREATE TABLE IF NOT EXISTS public.wishlist (
    id bigint NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, product_id)
);
CREATE SEQUENCE IF NOT EXISTS public.wishlist_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.wishlist ALTER COLUMN id SET DEFAULT nextval('public.wishlist_id_seq'::regclass);


-- Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL PRIMARY KEY,
    value text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    type text,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.notifications_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id bigint NOT NULL PRIMARY KEY,
    name text,
    email text,
    subject text,
    message text,
    status text DEFAULT 'unread'::text,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.contact_messages_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);

-- Order History Table
CREATE TABLE IF NOT EXISTS public.order_history (
    id bigint NOT NULL PRIMARY KEY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status public.order_status NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.order_history_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.order_history ALTER COLUMN id SET DEFAULT nextval('public.order_history_id_seq'::regclass);

-- Offers Table
CREATE TABLE IF NOT EXISTS public.offers (
    id bigint NOT NULL PRIMARY KEY,
    title text NOT NULL,
    subtitle text,
    code text NOT NULL UNIQUE,
    discount_percentage integer NOT NULL,
    status text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    image_url text,
    category_ids integer[],
    product_ids integer[],
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.offers_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.offers ALTER COLUMN id SET DEFAULT nextval('public.offers_id_seq'::regclass);


-- Home Page Sections Table
CREATE TABLE IF NOT EXISTS public.home_page_sections (
    id bigint NOT NULL PRIMARY KEY,
    category_id bigint NOT NULL UNIQUE REFERENCES public.categories(id) ON DELETE CASCADE,
    display_order integer NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS public.home_page_sections_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.home_page_sections ALTER COLUMN id SET DEFAULT nextval('public.home_page_sections_id_seq'::regclass);


-- Refunds Table
CREATE TABLE IF NOT EXISTS public.refunds (
    id bigint NOT NULL PRIMARY KEY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric(10,2) NOT NULL,
    reason text,
    status text DEFAULT 'Pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);
CREATE SEQUENCE IF NOT EXISTS public.refunds_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.refunds ALTER COLUMN id SET DEFAULT nextval('public.refunds_id_seq'::regclass);

-- Pages Table (for static content)
CREATE TABLE IF NOT EXISTS public.pages (
    slug text NOT NULL PRIMARY KEY,
    title text NOT NULL,
    content jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Cards Table
CREATE TABLE IF NOT EXISTS public.cards (
    id bigint NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_type text,
    last4 text,
    expiry_month integer,
    expiry_year integer,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.cards_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY public.cards ALTER COLUMN id SET DEFAULT nextval('public.cards_id_seq'::regclass);


-- =================================================================
-- 3. FUNCTIONS
-- =================================================================

-- Function to handle new user and create a profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, role, created_at)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url',
        'customer',
        new.created_at
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to create an order and its items
CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status public.order_status DEFAULT 'Pending'::public.order_status
)
RETURNS text AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item record;
    tran_id bigint;
BEGIN
    -- Insert into orders table and get the new order's ID and order_number
    INSERT INTO public.orders (user_id, total_amount, shipping_details, status, coupon_code, discount_amount)
    VALUES (
        auth.uid(),
        p_total_amount,
        p_shipping_details,
        p_initial_status,
        p_coupon_code,
        p_discount_amount
    )
    RETURNING id, order_number INTO new_order_id, new_order_number;

    -- Insert order items
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id int, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, item.product_id, item.quantity, item.price);
    END LOOP;
    
    -- Insert a transaction record
    INSERT INTO public.transactions(order_id, user_id, amount, payment_method, transaction_details, status)
    VALUES (new_order_id, auth.uid(), p_total_amount, p_payment_method, p_transaction_details, 'Completed')
    RETURNING id INTO tran_id;

    -- Log initial order creation
    INSERT INTO public.order_history (order_id, status)
    VALUES (new_order_id, p_initial_status);
    
    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Other functions...
-- (Remaining functions from the original script)
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id uuid, full_name text, email text, avatar_url text, role user_role, created_at timestamp with time zone) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, p.full_name, u.email, p.avatar_url, p.role, u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.order_history (order_id, status)
        VALUES (NEW.id, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_order_status_and_log(p_order_id integer, p_new_status text)
RETURNS SETOF public.orders AS $$
BEGIN
    UPDATE public.orders
    SET status = p_new_status::public.order_status
    WHERE id = p_order_id;

    RETURN QUERY SELECT * FROM public.orders WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;


-- =================================================================
-- 4. TRIGGERS
-- =================================================================
-- Trigger to call handle_new_user on new user sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to set created_at and updated_at on settings table
DROP TRIGGER IF EXISTS set_settings_timestamp ON public.settings;
CREATE TRIGGER set_settings_timestamp
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Trigger to log order status changes
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.log_order_status_change();

-- =================================================================
-- 5. RLS (ROW LEVEL SECURITY)
-- =================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;


-- Policies for public tables (read-only for all)
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Allow public read access to product_categories" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to product_tags" ON public.product_tags FOR SELECT USING (true);
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow public read access to questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow public read access to offers" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Allow public read access to home_page_sections" ON public.home_page_sections FOR SELECT USING (true);
CREATE POLICY "Allow public read access to pages" ON public.pages FOR SELECT USING (true);


-- Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policies for authenticated users
CREATE POLICY "Authenticated users can submit reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can submit questions" ON public.questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own refund requests" ON public.refunds FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own cards" ON public.cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- Policies for Admins
-- (Assuming an is_admin() function or similar role check)

-- This is a placeholder for a role check function.
-- You MUST create this function in your database for admin policies to work.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super-admin', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can manage all users" ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage tags" ON public.tags FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage product-category links" ON public.product_categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage product-tag links" ON public.product_tags FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all reviews" ON public.reviews FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all questions" ON public.questions FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all order items" ON public.order_items FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage site settings" ON public.settings FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view order history" ON public.order_history FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage offers" ON public.offers FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage home page sections" ON public.home_page_sections FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage refunds" ON public.refunds FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage pages" ON public.pages FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage cards" ON public.cards FOR ALL USING (public.is_admin());


-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Grant all privileges on all tables in public
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;


-- Grant exec on all functions to anon, authenticated, service_role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

