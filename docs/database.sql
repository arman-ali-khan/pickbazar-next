-- Drop the old, incorrect function if it exists to resolve ambiguity
DROP FUNCTION IF EXISTS public.create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric, text);
DROP FUNCTION IF EXISTS public.create_order(p_total_amount => numeric, p_shipping_details => jsonb, p_items => jsonb, p_payment_method => text, p_transaction_details => jsonb, p_coupon_code => text, p_discount_amount => numeric, p_initial_status => text);


-- Ensures the 'order_status' enum type exists
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


-- Addresses Table
CREATE SEQUENCE IF NOT EXISTS public.addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.addresses (
    id integer NOT NULL DEFAULT nextval('public.addresses_id_seq'::regclass),
    user_id uuid NOT NULL,
    title text NOT NULL,
    street_address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip text NOT NULL,
    country text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    address_type text DEFAULT 'shipping'::text
);

-- Cards Table
CREATE SEQUENCE IF NOT EXISTS public.cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.cards (
    id integer NOT NULL DEFAULT nextval('public.cards_id_seq'::regclass),
    user_id uuid NOT NULL,
    card_type text NOT NULL,
    last4 text NOT NULL,
    expiry_month integer NOT NULL,
    expiry_year integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Categories Table
CREATE SEQUENCE IF NOT EXISTS public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.categories (
    id integer NOT NULL DEFAULT nextval('public.categories_id_seq'::regclass),
    name text NOT NULL,
    slug text NOT NULL,
    icon text,
    parent_id integer,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- Contact Messages Table
CREATE SEQUENCE IF NOT EXISTS public.contact_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id integer NOT NULL DEFAULT nextval('public.contact_messages_id_seq'::regclass),
    name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'unread'::text,
    created_at timestamp with time zone DEFAULT now()
);

-- Home Page Sections Table
CREATE SEQUENCE IF NOT EXISTS public.home_page_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.home_page_sections (
    id integer NOT NULL DEFAULT nextval('public.home_page_sections_id_seq'::regclass),
    category_id integer NOT NULL,
    display_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Notifications Table
CREATE SEQUENCE IF NOT EXISTS public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.notifications (
    id integer NOT NULL DEFAULT nextval('public.notifications_id_seq'::regclass),
    user_id uuid,
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false,
    type text,
    created_at timestamp with time zone DEFAULT now()
);

-- Offers Table
CREATE SEQUENCE IF NOT EXISTS public.offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.offers (
    id integer NOT NULL DEFAULT nextval('public.offers_id_seq'::regclass),
    title text NOT NULL,
    subtitle text,
    code text NOT NULL,
    discount_percentage numeric NOT NULL,
    status text DEFAULT 'inactive'::text NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    image_url text,
    category_ids integer[],
    product_ids integer[],
    created_at timestamp with time zone DEFAULT now()
);

-- Orders Table
CREATE SEQUENCE IF NOT EXISTS public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.orders (
    id integer NOT NULL DEFAULT nextval('public.orders_id_seq'::regclass),
    user_id uuid,
    order_number text NOT NULL,
    total_amount numeric NOT NULL,
    status public.order_status DEFAULT 'Pending'::public.order_status,
    shipping_details jsonb,
    payment_details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    coupon_code text,
    discount_amount numeric,
    payment_method text
);

-- Pages Table
CREATE SEQUENCE IF NOT EXISTS public.pages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
    
CREATE TABLE IF NOT EXISTS public.pages (
    id integer NOT NULL DEFAULT nextval('public.pages_id_seq'::regclass),
    slug text NOT NULL,
    title text NOT NULL,
    content jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Product Categories Table
CREATE SEQUENCE IF NOT EXISTS public.product_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.product_categories (
    id integer NOT NULL DEFAULT nextval('public.product_categories_id_seq'::regclass),
    product_id integer NOT NULL,
    category_id integer NOT NULL
);

-- Product Tags Table
CREATE SEQUENCE IF NOT EXISTS public.product_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.product_tags (
    id integer NOT NULL DEFAULT nextval('public.product_tags_id_seq'::regclass),
    product_id integer NOT NULL,
    tag_id integer NOT NULL
);

-- Products Table
CREATE SEQUENCE IF NOT EXISTS public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.products (
    id integer NOT NULL DEFAULT nextval('public.products_id_seq'::regclass),
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    status text DEFAULT 'draft'::text,
    stock integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    featured_image_url text,
    gallery_urls text[],
    unit text,
    original_price numeric,
    slug text NOT NULL,
    view_count integer DEFAULT 0
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    updated_at timestamp with time zone,
    full_name text,
    avatar_url text,
    bio text,
    contact_number text,
    role text DEFAULT 'customer'::text
);

-- Promos Table
CREATE SEQUENCE IF NOT EXISTS public.promos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.promos (
    id integer NOT NULL DEFAULT nextval('public.promos_id_seq'::regclass),
    title text NOT NULL,
    subtitle text,
    button_text text,
    button_link text,
    image_url text,
    status text DEFAULT 'inactive'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Questions Table
CREATE SEQUENCE IF NOT EXISTS public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
    
CREATE TABLE IF NOT EXISTS public.questions (
    id integer NOT NULL DEFAULT nextval('public.questions_id_seq'::regclass),
    product_id integer NOT NULL,
    user_id uuid NOT NULL,
    question_text text NOT NULL,
    answer_text text,
    created_at timestamp with time zone DEFAULT now(),
    answered_at timestamp with time zone,
    status text DEFAULT 'Pending'::text
);

-- Refunds Table
CREATE SEQUENCE IF NOT EXISTS public.refunds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.refunds (
    id integer NOT NULL DEFAULT nextval('public.refunds_id_seq'::regclass),
    order_id integer NOT NULL,
    user_id uuid NOT NULL,
    amount numeric NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'Pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);

-- Reviews Table
CREATE SEQUENCE IF NOT EXISTS public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.reviews (
    id integer NOT NULL DEFAULT nextval('public.reviews_id_seq'::regclass),
    product_id integer NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    text text,
    created_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'Pending'::text
);

-- Settings Table
CREATE SEQUENCE IF NOT EXISTS public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.settings (
    id integer NOT NULL DEFAULT nextval('public.settings_id_seq'::regclass),
    key text NOT NULL,
    value text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);

-- Tags Table
CREATE SEQUENCE IF NOT EXISTS public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.tags (
    id integer NOT NULL DEFAULT nextval('public.tags_id_seq'::regclass),
    name text NOT NULL,
    slug text NOT NULL
);

-- Transactions Table
CREATE SEQUENCE IF NOT EXISTS public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.transactions (
    id integer NOT NULL DEFAULT nextval('public.transactions_id_seq'::regclass),
    order_id integer NOT NULL,
    user_id uuid NOT NULL,
    amount numeric NOT NULL,
    payment_method text NOT NULL,
    status text DEFAULT 'Completed'::text,
    transaction_details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Wishlist Table
CREATE SEQUENCE IF NOT EXISTS public.wishlist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.wishlist (
    id integer NOT NULL DEFAULT nextval('public.wishlist_id_seq'::regclass),
    user_id uuid NOT NULL,
    product_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Define Primary Keys
ALTER TABLE ONLY public.addresses ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cards ADD CONSTRAINT cards_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.contact_messages ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.home_page_sections ADD CONSTRAINT home_page_sections_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.offers ADD CONSTRAINT offers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.pages ADD CONSTRAINT pages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_tags ADD CONSTRAINT product_tags_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.promos ADD CONSTRAINT promos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.questions ADD CONSTRAINT questions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.refunds ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.settings ADD CONSTRAINT settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tags ADD CONSTRAINT tags_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_pkey PRIMARY KEY (id);

-- Define Unique Constraints
ALTER TABLE ONLY public.offers ADD CONSTRAINT offers_code_key UNIQUE (code);
ALTER TABLE ONLY public.pages ADD CONSTRAINT pages_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (full_name);
ALTER TABLE ONLY public.settings ADD CONSTRAINT settings_key_key UNIQUE (key);
ALTER TABLE ONLY public.tags ADD CONSTRAINT tags_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_user_id_product_id_key UNIQUE (user_id, product_id);


-- Define Foreign Keys
ALTER TABLE ONLY public.addresses ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cards ADD CONSTRAINT cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.home_page_sections ADD CONSTRAINT home_page_sections_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_tags ADD CONSTRAINT product_tags_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_tags ADD CONSTRAINT product_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.questions ADD CONSTRAINT questions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.questions ADD CONSTRAINT questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.refunds ADD CONSTRAINT refunds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.refunds ADD CONSTRAINT refunds_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.transactions ADD CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.wishlist ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- create_order function
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
    v_order_id int;
    v_order_number text;
    v_user_id uuid;
    item jsonb;
BEGIN
    -- Get user ID from session
    v_user_id := auth.uid();

    -- Generate a unique order number (e.g., timestamp + random string)
    v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(md5(random()::text), 1, 6);

    -- Insert into orders table
    INSERT INTO public.orders (
        user_id, order_number, total_amount, status, shipping_details, coupon_code, discount_amount, payment_method
    )
    VALUES (
        v_user_id, v_order_number, p_total_amount, p_initial_status, p_shipping_details, p_coupon_code, p_discount_amount, p_payment_method
    )
    RETURNING id INTO v_order_id;

    -- Insert into order_items table
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (v_order_id, (item->>'product_id')::int, (item->>'quantity')::int, (item->>'price')::numeric);

        -- Decrement stock
        UPDATE public.products
        SET stock = stock - (item->>'quantity')::int
        WHERE id = (item->>'product_id')::int;
    END LOOP;

    -- Insert into transactions table
    INSERT INTO public.transactions (
        order_id, user_id, amount, payment_method, status, transaction_details
    )
    VALUES (
        v_order_id, v_user_id, p_total_amount, p_payment_method, 
        CASE WHEN p_initial_status = 'Processing' THEN 'Completed'::text ELSE 'Pending'::text END,
        p_transaction_details
    );

    RETURN v_order_number;
END;
$$;


-- Enable Row Level Security for all tables
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
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
