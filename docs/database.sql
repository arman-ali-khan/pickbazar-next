--
-- Types
--
CREATE TYPE order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Failed');
CREATE TYPE review_status AS ENUM ('Pending', 'Approved', 'Hidden');
CREATE TYPE question_status AS ENUM ('Pending', 'Answered', 'Hidden');
CREATE TYPE refund_status AS ENUM ('Pending', 'Approved', 'Rejected');
CREATE TYPE offer_status AS ENUM ('active', 'inactive', 'expired');
CREATE TYPE user_role AS ENUM ('customer', 'manager', 'admin', 'super-admin');
CREATE TYPE notification_type AS ENUM (
    'new_order', 
    'order_update', 
    'new_review', 
    'new_question', 
    'question_answered', 
    'new_refund', 
    'refund_update', 
    'promotion', 
    'role_update',
    'new_message',
    'security'
);
CREATE TYPE address_type AS ENUM ('billing', 'shipping');

--
-- Tables
--

CREATE TABLE IF NOT EXISTS "categories" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "name" text NOT NULL,
    "slug" text NOT NULL,
    "description" text,
    "parent_id" bigint,
    "icon" text
);
CREATE SEQUENCE IF NOT EXISTS categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE categories_id_seq OWNED BY categories.id;
ALTER TABLE ONLY "categories" ALTER COLUMN "id" SET DEFAULT nextval('categories_id_seq'::regclass);
ALTER TABLE ONLY "categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "categories" ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");
ALTER TABLE ONLY "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "tags" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "name" text NOT NULL,
    "slug" text NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE tags_id_seq OWNED BY tags.id;
ALTER TABLE ONLY "tags" ALTER COLUMN "id" SET DEFAULT nextval('tags_id_seq'::regclass);
ALTER TABLE ONLY "tags" ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "tags" ADD CONSTRAINT "tags_name_key" UNIQUE ("name");
ALTER TABLE ONLY "tags" ADD CONSTRAINT "tags_slug_key" UNIQUE ("slug");

CREATE TABLE IF NOT EXISTS "products" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "price" numeric(10,2) NOT NULL,
    "original_price" numeric(10,2),
    "stock" integer DEFAULT 0 NOT NULL,
    "status" text DEFAULT 'draft'::text NOT NULL,
    "featured_image_url" text,
    "gallery_urls" text[],
    "slug" text NOT NULL,
    "unit" text,
    "view_count" integer DEFAULT 0 NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE products_id_seq OWNED BY products.id;
ALTER TABLE ONLY "products" ALTER COLUMN "id" SET DEFAULT nextval('products_id_seq'::regclass);
ALTER TABLE ONLY "products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");

CREATE TABLE IF NOT EXISTS "product_categories" (
    "id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "category_id" bigint NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS product_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE product_categories_id_seq OWNED BY product_categories.id;
ALTER TABLE ONLY "product_categories" ALTER COLUMN "id" SET DEFAULT nextval('product_categories_id_seq'::regclass);
ALTER TABLE ONLY "product_categories" ADD CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "product_categories" ADD CONSTRAINT "product_categories_product_id_category_id_key" UNIQUE ("product_id", "category_id");
ALTER TABLE ONLY "product_categories" ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY "product_categories" ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "product_tags" (
    "id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "tag_id" bigint NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS product_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE product_tags_id_seq OWNED BY product_tags.id;
ALTER TABLE ONLY "product_tags" ALTER COLUMN "id" SET DEFAULT nextval('product_tags_id_seq'::regclass);
ALTER TABLE ONLY "product_tags" ADD CONSTRAINT "product_tags_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "product_tags" ADD CONSTRAINT "product_tags_product_id_tag_id_key" UNIQUE ("product_id", "tag_id");
ALTER TABLE ONLY "product_tags" ADD CONSTRAINT "product_tags_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE ONLY "product_tags" ADD CONSTRAINT "product_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "orders" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "user_id" uuid NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "status" order_status DEFAULT 'Pending'::order_status NOT NULL,
    "shipping_details" jsonb,
    "order_number" text NOT NULL,
    "payment_method" text,
    "payment_details" jsonb,
    "coupon_code" text,
    "discount_amount" numeric(10,2)
);
CREATE SEQUENCE IF NOT EXISTS orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE orders_id_seq OWNED BY orders.id;
ALTER TABLE ONLY "orders" ALTER COLUMN "id" SET DEFAULT nextval('orders_id_seq'::regclass);
ALTER TABLE ONLY "orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "orders" ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");
ALTER TABLE ONLY "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "order_items" (
    "id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "quantity" integer NOT NULL,
    "price_at_purchase" numeric(10,2) NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS order_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE order_items_id_seq OWNED BY order_items.id;
ALTER TABLE ONLY "order_items" ALTER COLUMN "id" SET DEFAULT nextval('order_items_id_seq'::regclass);
ALTER TABLE ONLY "order_items" ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "reviews" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "user_id" uuid NOT NULL,
    "product_id" bigint NOT NULL,
    "rating" integer NOT NULL,
    "text" text,
    "status" review_status DEFAULT 'Pending'::review_status NOT NULL
);
ALTER TABLE ONLY "reviews" ADD CONSTRAINT "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5)));
CREATE SEQUENCE IF NOT EXISTS reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE reviews_id_seq OWNED BY reviews.id;
ALTER TABLE ONLY "reviews" ALTER COLUMN "id" SET DEFAULT nextval('reviews_id_seq'::regclass);
ALTER TABLE ONLY "reviews" ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "reviews" ADD CONSTRAINT "reviews_user_id_product_id_key" UNIQUE ("user_id", "product_id");
ALTER TABLE ONLY "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE ONLY "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "questions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "user_id" uuid NOT NULL,
    "product_id" bigint NOT NULL,
    "question_text" text NOT NULL,
    "answer_text" text,
    "status" question_status DEFAULT 'Pending'::question_status NOT NULL,
    "answered_at" timestamp with time zone
);
CREATE SEQUENCE IF NOT EXISTS questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE questions_id_seq OWNED BY questions.id;
ALTER TABLE ONLY "questions" ALTER COLUMN "id" SET DEFAULT nextval('questions_id_seq'::regclass);
ALTER TABLE ONLY "questions" ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "questions" ADD CONSTRAINT "questions_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE ONLY "questions" ADD CONSTRAINT "questions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "wishlist" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "user_id" uuid NOT NULL,
    "product_id" bigint NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS wishlist_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE wishlist_id_seq OWNED BY wishlist.id;
ALTER TABLE ONLY "wishlist" ALTER COLUMN "id" SET DEFAULT nextval('wishlist_id_seq'::regclass);
ALTER TABLE ONLY "wishlist" ADD CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "wishlist" ADD CONSTRAINT "wishlist_user_id_product_id_key" UNIQUE ("user_id", "product_id");
ALTER TABLE ONLY "wishlist" ADD CONSTRAINT "wishlist_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE ONLY "wishlist" ADD CONSTRAINT "wishlist_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "contact_messages" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "subject" text NOT NULL,
    "message" text NOT NULL,
    "status" text DEFAULT 'unread'::text NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS contact_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE contact_messages_id_seq OWNED BY contact_messages.id;
ALTER TABLE ONLY "contact_messages" ALTER COLUMN "id" SET DEFAULT nextval('contact_messages_id_seq'::regclass);
ALTER TABLE ONLY "contact_messages" ADD CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id");


CREATE TABLE IF NOT EXISTS "settings" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "key" text NOT NULL,
    "value" text
);
CREATE SEQUENCE IF NOT EXISTS settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE settings_id_seq OWNED BY settings.id;
ALTER TABLE ONLY "settings" ALTER COLUMN "id" SET DEFAULT nextval('settings_id_seq'::regclass);
ALTER TABLE ONLY "settings" ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "settings" ADD CONSTRAINT "settings_key_key" UNIQUE ("key");

CREATE TABLE IF NOT EXISTS "pages" (
    "id" bigint NOT NULL,
    "slug" text NOT NULL,
    "title" text NOT NULL,
    "content" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS pages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE pages_id_seq OWNED BY pages.id;
ALTER TABLE ONLY "pages" ALTER COLUMN "id" SET DEFAULT nextval('pages_id_seq'::regclass);
ALTER TABLE ONLY "pages" ADD CONSTRAINT "pages_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "pages" ADD CONSTRAINT "pages_slug_key" UNIQUE ("slug");

CREATE TABLE IF NOT EXISTS "offers" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "title" text NOT NULL,
    "subtitle" text,
    "code" text NOT NULL,
    "discount_percentage" numeric(5,2) NOT NULL,
    "status" offer_status DEFAULT 'inactive'::offer_status NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "image_url" text,
    "category_ids" bigint[],
    "product_ids" bigint[]
);
CREATE SEQUENCE IF NOT EXISTS offers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE offers_id_seq OWNED BY offers.id;
ALTER TABLE ONLY "offers" ALTER COLUMN "id" SET DEFAULT nextval('offers_id_seq'::regclass);
ALTER TABLE ONLY "offers" ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "offers" ADD CONSTRAINT "offers_code_key" UNIQUE ("code");


CREATE TABLE IF NOT EXISTS "promos" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "title" text NOT NULL,
    "subtitle" text,
    "button_text" text,
    "button_link" text,
    "status" text NOT NULL,
    "image_url" text
);
CREATE SEQUENCE IF NOT EXISTS promos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE promos_id_seq OWNED BY promos.id;
ALTER TABLE ONLY "promos" ALTER COLUMN "id" SET DEFAULT nextval('promos_id_seq'::regclass);
ALTER TABLE ONLY "promos" ADD CONSTRAINT "promos_pkey" PRIMARY KEY ("id");


CREATE TABLE IF NOT EXISTS "refunds" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "order_id" bigint NOT NULL,
    "user_id" uuid NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "reason" text NOT NULL,
    "status" refund_status DEFAULT 'Pending'::refund_status NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS refunds_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE refunds_id_seq OWNED BY refunds.id;
ALTER TABLE ONLY "refunds" ALTER COLUMN "id" SET DEFAULT nextval('refunds_id_seq'::regclass);
ALTER TABLE ONLY "refunds" ADD CONSTRAINT "refunds_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "refunds" ADD CONSTRAINT "refunds_order_id_key" UNIQUE ("order_id");
ALTER TABLE ONLY "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY "refunds" ADD CONSTRAINT "refunds_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "transactions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "order_id" bigint NOT NULL,
    "user_id" uuid NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "payment_method" text NOT NULL,
    "status" text NOT NULL,
    "transaction_details" jsonb
);
CREATE SEQUENCE IF NOT EXISTS transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE transactions_id_seq OWNED BY transactions.id;
ALTER TABLE ONLY "transactions" ALTER COLUMN "id" SET DEFAULT nextval('transactions_id_seq'::regclass);
ALTER TABLE ONLY "transactions" ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "transactions" ADD CONSTRAINT "transactions_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "notifications" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "user_id" uuid,
    "title" text NOT NULL,
    "message" text,
    "is_read" boolean DEFAULT false NOT NULL,
    "link" text,
    "type" notification_type
);
CREATE SEQUENCE IF NOT EXISTS notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE notifications_id_seq OWNED BY notifications.id;
ALTER TABLE ONLY "notifications" ALTER COLUMN "id" SET DEFAULT nextval('notifications_id_seq'::regclass);
ALTER TABLE ONLY "notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "order_history" (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);

CREATE TABLE IF NOT EXISTS "addresses" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "user_id" uuid NOT NULL,
    "address_type" address_type NOT NULL,
    "title" text,
    "country" text NOT NULL,
    "city" text NOT NULL,
    "state" text NOT NULL,
    "zip" text NOT NULL,
    "street_address" text NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS addresses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE addresses_id_seq OWNED BY addresses.id;
ALTER TABLE ONLY "addresses" ALTER COLUMN "id" SET DEFAULT nextval('addresses_id_seq'::regclass);
ALTER TABLE ONLY "addresses" ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "cards" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "user_id" uuid NOT NULL,
    "card_type" text,
    "last4" text NOT NULL,
    "expiry_month" integer NOT NULL,
    "expiry_year" integer NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS cards_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE cards_id_seq OWNED BY cards.id;
ALTER TABLE ONLY "cards" ALTER COLUMN "id" SET DEFAULT nextval('cards_id_seq'::regclass);
ALTER TABLE ONLY "cards" ADD CONSTRAINT "cards_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "cards" ADD CONSTRAINT "cards_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "home_page_sections" (
    "id" bigint NOT NULL,
    "category_id" bigint NOT NULL,
    "display_order" integer NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS home_page_sections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE home_page_sections_id_seq OWNED BY home_page_sections.id;
ALTER TABLE ONLY "home_page_sections" ALTER COLUMN "id" SET DEFAULT nextval('home_page_sections_id_seq'::regclass);
ALTER TABLE ONLY "home_page_sections" ADD CONSTRAINT "home_page_sections_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "home_page_sections" ADD CONSTRAINT "home_page_sections_category_id_key" UNIQUE (category_id);
ALTER TABLE ONLY "home_page_sections" ADD CONSTRAINT "home_page_sections_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

--
-- Functions
--
DROP FUNCTION IF EXISTS public.handle_new_user();
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

DROP FUNCTION IF EXISTS public.log_order_status_change();
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO order_history (order_id, status)
        VALUES (NEW.id, NEW.status);
    ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO order_history (order_id, status)
        VALUES (NEW.id, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS public.create_order(numeric,jsonb,jsonb,text,jsonb,text,numeric,order_status);
CREATE OR REPLACE FUNCTION public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status order_status)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_order_id BIGINT;
    v_order_number TEXT;
    v_user_id UUID;
    item RECORD;
BEGIN
    -- 1. Get current user ID
    SELECT auth.uid() INTO v_user_id;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- 2. Generate a unique order number
    v_order_number := 'KB-' || to_char(NOW(), 'YYMMDD') || '-' || LPAD(nextval('orders_id_seq')::text, 6, '0');

    -- 3. Create the order
    INSERT INTO public.orders (user_id, total_amount, shipping_details, order_number, payment_method, status, coupon_code, discount_amount)
    VALUES (v_user_id, p_total_amount, p_shipping_details, v_order_number, p_payment_method, p_initial_status, p_coupon_code, p_discount_amount)
    RETURNING id INTO v_order_id;

    -- 4. Insert order items
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id BIGINT, quantity INT, price NUMERIC)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (v_order_id, item.product_id, item.quantity, item.price);
    END LOOP;
    
    -- 5. Insert transaction record
    INSERT INTO public.transactions (order_id, user_id, amount, payment_method, status, transaction_details)
    VALUES (v_order_id, v_user_id, p_total_amount, p_payment_method, 'Completed', p_transaction_details);

    RETURN v_order_number;
END;
$function$;

--
-- Triggers
--
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS log_order_status_trigger ON orders;
CREATE TRIGGER log_order_status_trigger
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();


--
-- RLS
--
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING ((auth.uid() = id));

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super-admin', 'manager'));

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (
    (auth.uid() = (SELECT user_id FROM orders WHERE id = order_id))
);
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
CREATE POLICY "Admins can manage all order items" ON public.order_items FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super-admin', 'manager'));

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Reviews are public" ON public.reviews;
CREATE POLICY "Reviews are public" ON public.reviews FOR SELECT USING (status = 'Approved');
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super-admin', 'manager'));

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own questions" ON public.questions;
CREATE POLICY "Users can insert their own questions" ON public.questions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
CREATE POLICY "Admins can manage questions" ON public.questions FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super-admin', 'manager'));
DROP POLICY IF EXISTS "Questions are public" ON public.questions;
CREATE POLICY "Questions are public" ON public.questions FOR SELECT USING (true);


ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlist;
CREATE POLICY "Users can manage their own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super-admin', 'manager'));

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings are public" ON public.settings;
CREATE POLICY "Settings are public" ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super-admin', 'manager'));

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pages are public" ON public.pages;
CREATE POLICY "Pages are public" ON public.pages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage pages" ON public.pages;
CREATE POLICY "Admins can manage pages" ON public.pages FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super-admin', 'manager'));


ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Offers are public" ON public.offers;
CREATE POLICY "Offers are public" ON public.offers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage offers" ON public.offers;
CREATE POLICY "Admins can manage offers" ON public.offers FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super-admin', 'manager'));

ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Promos are public" ON public.promos;
CREATE POLICY "Promos are public" ON public.promos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage promos" ON public.promos;
CREATE POLICY "Admins can manage promos" ON public.promos FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super-admin', 'manager'));

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own refunds" ON public.refunds;
CREATE POLICY "Users can manage their own refunds" ON public.refunds FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all refunds" ON public.refunds;
CREATE POLICY "Admins can manage all refunds" ON public.refunds FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super-admin', 'manager'));

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;
CREATE POLICY "Admins can manage transactions" ON public.transactions FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super-admin', 'manager'));

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admin notifications are viewable by admins" ON public.notifications;
CREATE POLICY "Admin notifications are viewable by admins" ON public.notifications FOR SELECT USING (user_id IS NULL AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super-admin', 'manager'));
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super-admin', 'manager'));


ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;
CREATE POLICY "Users can manage their own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own cards" ON public.cards;
CREATE POLICY "Users can manage their own cards" ON public.cards FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Home page sections are public" ON public.home_page_sections;
CREATE POLICY "Home page sections are public" ON public.home_page_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage home page sections" ON public.home_page_sections;
CREATE POLICY "Admins can manage home page sections" ON public.home_page_sections FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super-admin', 'manager'));
