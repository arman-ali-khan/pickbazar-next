-- Drop conflicting functions first to ensure a clean slate
DROP FUNCTION IF EXISTS public.create_order(numeric,jsonb,jsonb,text,jsonb,text,numeric,order_status);
DROP FUNCTION IF EXISTS public.create_order(numeric,jsonb,jsonb,text,jsonb,text,numeric,text);
DROP FUNCTION IF EXISTS public.update_home_sections(jsonb);

-- Custom Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE "public"."order_status" AS ENUM (
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
        CREATE TYPE "public"."user_role" AS ENUM (
            'customer',
            'manager',
            'admin',
            'super-admin'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE "public"."notification_type" AS ENUM (
            'new_order',
            'order_update',
            'new_review',
            'new_question',
            'question_answered',
            'new_refund',
            'refund_update',
            'role_update',
            'new_message',
            'promotion'
        );
    END IF;
END$$;


-- Tables
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "contact_number" "text",
    "role" "public"."user_role" DEFAULT 'customer'::public.user_role,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_pkey ON public.profiles USING btree (id);
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY USING INDEX "profiles_pkey";
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES "auth"."users"(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "parent_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS categories_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."categories" ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS categories_pkey ON public.categories USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON public.categories USING btree (slug);
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY USING INDEX "categories_pkey";
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_slug_key" UNIQUE USING INDEX "categories_slug_key";
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS tags_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."tags" ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS tags_pkey ON public.tags USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS tags_slug_key ON public.tags USING btree (slug);
ALTER TABLE "public"."tags" ADD CONSTRAINT "tags_pkey" PRIMARY KEY USING INDEX "tags_pkey";
ALTER TABLE "public"."tags" ADD CONSTRAINT "tags_slug_key" UNIQUE USING INDEX "tags_slug_key";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "original_price" numeric(10,2),
    "stock" integer DEFAULT 0,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "unit" "text",
    "featured_image_url" "text",
    "gallery_urls" "text"[],
    "view_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS products_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."products" ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS products_pkey ON public.products USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products USING btree (slug);
ALTER TABLE "public"."products" ADD CONSTRAINT "products_pkey" PRIMARY KEY USING INDEX "products_pkey";
ALTER TABLE "public"."products" ADD CONSTRAINT "products_slug_key" UNIQUE USING INDEX "products_slug_key";

CREATE TABLE IF NOT EXISTS "public"."product_categories" (
    "product_id" bigint NOT NULL,
    "category_id" bigint NOT NULL
);
ALTER TABLE "public"."product_categories" ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS product_categories_pkey ON public.product_categories USING btree (product_id, category_id);
ALTER TABLE "public"."product_categories" ADD CONSTRAINT "product_categories_pkey" PRIMARY KEY USING INDEX "product_categories_pkey";
ALTER TABLE "public"."product_categories" ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
ALTER TABLE "public"."product_categories" ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "public"."product_tags" (
    "product_id" bigint NOT NULL,
    "tag_id" bigint NOT NULL
);
ALTER TABLE "public"."product_tags" ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS product_tags_pkey ON public.product_tags USING btree (product_id, tag_id);
ALTER TABLE "public"."product_tags" ADD CONSTRAINT "product_tags_pkey" PRIMARY KEY USING INDEX "product_tags_pkey";
ALTER TABLE "public"."product_tags" ADD CONSTRAINT "product_tags_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE "public"."product_tags" ADD CONSTRAINT "product_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "product_id" bigint NOT NULL,
    "rating" smallint NOT NULL,
    "text" "text",
    "status" "text" DEFAULT 'Pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS reviews_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."reviews" ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS reviews_pkey ON public.reviews USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_id_product_id_key ON public.reviews USING btree (user_id, product_id);
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_pkey" PRIMARY KEY USING INDEX "reviews_pkey";
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_user_id_product_id_key" UNIQUE USING INDEX "reviews_user_id_product_id_key";
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "product_id" bigint NOT NULL,
    "question_text" "text" NOT NULL,
    "answer_text" "text",
    "status" "text" DEFAULT 'Pending'::"text",
    "answered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS questions_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."questions" ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS questions_pkey ON public.questions USING btree (id);
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_pkey" PRIMARY KEY USING INDEX "questions_pkey";
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "order_number" "text" NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "status" "public"."order_status" DEFAULT 'Pending'::public.order_status,
    "shipping_details" "jsonb",
    "coupon_code" "text",
    "discount_amount" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "payment_details" jsonb,
    "payment_method" text
);
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS orders_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."orders" ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS orders_pkey ON public.orders USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key ON public.orders USING btree (order_number);
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY USING INDEX "orders_pkey";
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_order_number_key" UNIQUE USING INDEX "orders_order_number_key";
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "auth"."users"(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "quantity" integer NOT NULL,
    "price_at_purchase" numeric(10,2) NOT NULL
);
ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS order_items_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."order_items" ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS order_items_pkey ON public.order_items USING btree (id);
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_pkey" PRIMARY KEY USING INDEX "order_items_pkey";
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "public"."order_history" (
    id bigint generated by default as identity,
    order_id bigint not null,
    status public.order_status not null,
    created_at timestamp with time zone not null default now(),
    constraint order_history_pkey primary key (id),
    constraint order_history_order_id_fkey foreign key (order_id) references orders (id) on delete cascade
) tablespace pg_default;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "public"."refunds" (
    "id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'Pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."refunds" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS refunds_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."refunds" ALTER COLUMN id SET DEFAULT nextval('public.refunds_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS refunds_pkey ON public.refunds USING btree (id);
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_pkey" PRIMARY KEY USING INDEX "refunds_pkey";
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "public"."wishlist" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "product_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."wishlist" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS wishlist_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."wishlist" ALTER COLUMN id SET DEFAULT nextval('public.wishlist_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS wishlist_pkey ON public.wishlist USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS wishlist_user_id_product_id_key ON public.wishlist USING btree (user_id, product_id);
ALTER TABLE "public"."wishlist" ADD CONSTRAINT "wishlist_pkey" PRIMARY KEY USING INDEX "wishlist_pkey";
ALTER TABLE "public"."wishlist" ADD CONSTRAINT "wishlist_user_id_product_id_key" UNIQUE USING INDEX "wishlist_user_id_product_id_key";
ALTER TABLE "public"."wishlist" ADD CONSTRAINT "wishlist_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE "public"."wishlist" ADD CONSTRAINT "wishlist_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "public"."settings" (
    "key" "text" NOT NULL,
    "value" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS settings_pkey ON public.settings USING btree (key);
ALTER TABLE "public"."settings" ADD CONSTRAINT "settings_pkey" PRIMARY KEY USING INDEX "settings_pkey";

CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "message" "text",
    "link" "text",
    "is_read" boolean DEFAULT false,
    "type" "public"."notification_type",
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS notifications_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."notifications" ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS notifications_pkey ON public.notifications USING btree (id);
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY USING INDEX "notifications_pkey";
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "public"."contact_messages" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'unread'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."contact_messages" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS contact_messages_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."contact_messages" ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS contact_messages_pkey ON public.contact_messages USING btree (id);
ALTER TABLE "public"."contact_messages" ADD CONSTRAINT "contact_messages_pkey" PRIMARY KEY USING INDEX "contact_messages_pkey";

CREATE TABLE IF NOT EXISTS "public"."offers" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "code" "text" NOT NULL,
    "discount_percentage" numeric(5,2) NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "status" "text" NOT NULL,
    "image_url" "text",
    "category_ids" bigint[],
    "product_ids" bigint[],
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."offers" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS offers_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."offers" ALTER COLUMN id SET DEFAULT nextval('public.offers_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS offers_pkey ON public.offers USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS offers_code_key ON public.offers USING btree (code);
ALTER TABLE "public"."offers" ADD CONSTRAINT "offers_pkey" PRIMARY KEY USING INDEX "offers_pkey";
ALTER TABLE "public"."offers" ADD CONSTRAINT "offers_code_key" UNIQUE USING INDEX "offers_code_key";

CREATE TABLE IF NOT EXISTS "public"."promos" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "image_url" "text",
    "button_text" "text",
    "button_link" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."promos" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS promos_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."promos" ALTER COLUMN id SET DEFAULT nextval('public.promos_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS promos_pkey ON public.promos USING btree (id);
ALTER TABLE "public"."promos" ADD CONSTRAINT "promos_pkey" PRIMARY KEY USING INDEX "promos_pkey";


CREATE TABLE IF NOT EXISTS "public"."pages" (
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."pages" ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS pages_pkey ON public.pages USING btree (slug);
ALTER TABLE "public"."pages" ADD CONSTRAINT "pages_pkey" PRIMARY KEY USING INDEX "pages_pkey";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "address_type" "text",
    "street_address" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "country" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS addresses_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."addresses" ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS addresses_pkey ON public.addresses USING btree (id);
ALTER TABLE "public"."addresses" ADD CONSTRAINT "addresses_pkey" PRIMARY KEY USING INDEX "addresses_pkey";
ALTER TABLE "public"."addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "public"."cards" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "card_type" "text",
    "last4" "text" NOT NULL,
    "expiry_month" integer NOT NULL,
    "expiry_year" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."cards" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS cards_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."cards" ALTER COLUMN id SET DEFAULT nextval('public.cards_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS cards_pkey ON public.cards USING btree (id);
ALTER TABLE "public"."cards" ADD CONSTRAINT "cards_pkey" PRIMARY KEY USING INDEX "cards_pkey";
ALTER TABLE "public"."cards" ADD CONSTRAINT "cards_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "public"."home_page_sections" (
    "id" bigint NOT NULL,
    "category_id" bigint NOT NULL,
    "display_order" integer NOT NULL
);
ALTER TABLE "public"."home_page_sections" ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE IF NOT EXISTS home_page_sections_id_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."home_page_sections" ALTER COLUMN id SET DEFAULT nextval('public.home_page_sections_id_seq'::regclass);
CREATE UNIQUE INDEX IF NOT EXISTS home_page_sections_pkey ON public.home_page_sections USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS home_page_sections_category_id_key ON public.home_page_sections USING btree (category_id);
ALTER TABLE "public"."home_page_sections" ADD CONSTRAINT "home_page_sections_pkey" PRIMARY KEY USING INDEX "home_page_sections_pkey";
ALTER TABLE "public"."home_page_sections" ADD CONSTRAINT "home_page_sections_category_id_key" UNIQUE USING INDEX "home_page_sections_category_id_key";
ALTER TABLE "public"."home_page_sections" ADD CONSTRAINT "home_page_sections_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;

-- Sample Data Inserts
INSERT INTO "public"."categories" ("id", "name", "slug", "icon", "parent_id") VALUES
(1, 'Fruits & Vegetables', 'fruits-vegetables', 'Apple', NULL),
(2, 'Meat & Fish', 'meat-fish', 'Beef', NULL),
(3, 'Snacks', 'snacks', 'Cookie', NULL),
(4, 'Pet Care', 'pet-care', 'Dog', NULL),
(5, 'Home & Cleaning', 'home-cleaning', 'Home', NULL),
(6, 'Dairy', 'dairy', 'Milk', NULL),
(7, 'Cooking', 'cooking', 'Soup', NULL),
(8, 'Breakfast', 'breakfast', 'Cake', NULL),
(9, 'Beverage', 'beverage', 'GlassWater', NULL),
(10, 'Fruits', 'fruits', NULL, 1),
(11, 'Vegetables', 'vegetables', NULL, 1),
(12, 'Meat', 'meat', NULL, 2),
(13, 'Fish', 'fish', NULL, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "public"."tags" ("id", "name", "slug") VALUES
(1, 'Fresh', 'fresh'),
(2, 'Organic', 'organic'),
(3, 'Sale', 'sale'),
(4, 'Healthy', 'healthy'),
(5, 'New', 'new')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "public"."products" ("id", "name", "slug", "description", "price", "original_price", "stock", "status", "unit", "featured_image_url") OVERRIDING SYSTEM VALUE VALUES
(1, 'Apples', 'apples', 'Crisp and delicious red apples.', 1.60, 2.00, 50, 'active', '1lb', 'https://images.unsplash.com/photo-1439127989242-c3749a012eac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxyZWQlMjBhcHBsZXN8ZW58MHx8fHwxNzY4ODg3MzQxfDA&ixlib=rb-4.1.0&q=80&w=1080'),
(2, 'Baby Spinach', 'baby-spinach', 'Tender baby spinach leaves.', 0.60, NULL, 30, 'active', '2lb', 'https://images.unsplash.com/photo-1598278242809-6c21ee17aef1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxzcGluYWNofGVufDB8fHx8MTc2ODk3ODI1N3ww&ixlib=rb-4.1.0&q=80&w=1080'),
(3, 'Blueberries', 'blueberries', 'Sweet and juicy blueberries.', 3.00, NULL, 40, 'active', '1lb', 'https://images.unsplash.com/photo-1606757389667-45c2024f9fa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxibHVlYmVycmllc3xlbnwwfHx8fDE3Njg5MDQ2ODR8MA&ixlib=rb-4.1.0&q=80&w=1080'),
(4, 'Brussels Sprout', 'brussels-sprout', 'Fresh Brussels sprouts.', 3.69, 4.50, 25, 'active', '1lb', 'https://images.unsplash.com/photo-1670843840538-9fe8d95b59f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxicnVzc2VscyUyMHNwcm91dHxlbnwwfHx8fDE3Njg5MDA4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080'),
(5, 'Clementines', 'clementines', 'Easy-to-peel clementines.', 2.50, 2.75, 60, 'active', '1lb', 'https://images.unsplash.com/photo-1706773183787-c03c3eb709f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxjbGVtZW50aW5lc3xlbnwwfHx8fDE3Njg5MDA4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080'),
(6, 'Radish', 'radish', 'Crunchy and peppery radishes.', 2.11, 2.59, 35, 'active', '1lbs', 'https://images.unsplash.com/photo-1687199129802-3e4cc27baac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxmcmVzaCUyMHJhZGlzaGVzfGVufDB8fHx8MTc2ODk3ODI1OHww&ixlib=rb-4.1.0&q=80&w=1080'),
(7, 'Wegman''s Carrots', 'wegmans-carrots', 'Fresh and sweet carrots.', 2.10, NULL, 55, 'active', '1lbs', 'https://images.unsplash.com/photo-1741518359356-623aa8385826?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxmcmVzaCUyMGNhcnJvdHN8ZW58MHx8fHwxNzY4OTExMDI2fDA&ixlib=rb-4.1.0&q=80&w=1080'),
(8, 'White Radish', 'white-radish', 'Mild and crisp white radish.', 2.99, NULL, 20, 'active', '1lbs', 'https://images.unsplash.com/photo-1593629718347-283811841101?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHx3aGl0ZSUyMHJhZGlzaHxlbnwwfHx8fDE3Njg5NzgyNTh8MA&ixlib=rb-4.1.0&q=80&w=1080')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "public"."product_categories" ("product_id", "category_id") VALUES
(1, 10), (2, 11), (3, 10), (4, 11), (5, 10), (6, 11), (7, 11), (8, 11)
ON CONFLICT (product_id, category_id) DO NOTHING;

INSERT INTO "public"."pages" ("slug", "title", "content") VALUES
('about', 'About Us', '{"title": "Welcome to Karwanbazar", "subtitle": "Your friendly neighborhood grocery store, now online! We are passionate about bringing you the freshest produce, highest quality meats, and all your household needs with a smile.", "missionTitle": "Our Mission", "missionText": "<p>To provide our community with convenient access to fresh, high-quality groceries at fair prices, while supporting local farmers and producers. We believe in good food and good service.</p>", "teamTitle": "Meet Our Team", "team": [{"name": "John Doe", "role": "CEO & Founder", "bio": "<p>John started this store with a passion for quality food and community.</p>"}, {"name": "Jane Smith", "role": "Head of Operations", "bio": "<p>Jane keeps everything running smoothly, from the warehouse to your door.</p>"}, {"name": "Peter Jones", "role": "Lead Developer", "bio": "<p>Peter is the wizard behind our seamless online shopping experience.</p>"}]}'),
('contact', 'Contact Us', '{"address": "123 Grocery Lane, Foodie City, 12345", "email": "support@karwanbazar.com", "phone": "+1 (555) 123-4567"}'),
('faq', 'Frequently Asked Questions', '{"faqs": [{"question": "How does delivery work?", "answer": "We deliver within 90 minutes. You will be notified when your order is on its way."}, {"question": "What is your return policy?", "answer": "We offer a 24-hour return policy on most items, provided they are in their original condition."}]}'),
('privacy-policy', 'Privacy Policy', '{"html": "<h1>Privacy Policy</h1><p>Your privacy is important to us. It is Karwanbazar''s policy to respect your privacy regarding any information we may collect from you across our website.</p>"}'),
('terms-and-conditions', 'Terms & Conditions', '{"html": "<h1>Terms and Conditions</h1><p>By accessing the website at Karwanbazar, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>"}')
ON CONFLICT (slug) DO NOTHING;

-- Functions & Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at text,
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
        jsonb_build_object(
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ) as profiles,
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', oi.id,
                'quantity', oi.quantity,
                'price_at_purchase', oi.price_at_purchase,
                'products', jsonb_build_object(
                    'name', pr.name,
                    'featured_image_url', pr.featured_image_url
                )
            )
        ) FROM order_items oi JOIN products pr ON oi.product_id = pr.id WHERE oi.order_id = o.id) as order_items,
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.payment_details ->> 'transaction_details' as transaction_details
    FROM
        orders o
    LEFT JOIN
        profiles p ON o.user_id = p.id
    WHERE
        o.order_number = p_order_number;
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
    p_initial_status text
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item record;
BEGIN
    -- Generate a unique order number
    new_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || nextval('orders_id_seq');

    -- Create the order
    INSERT INTO public.orders (
        user_id,
        order_number,
        total_amount,
        shipping_details,
        payment_method,
        payment_details,
        coupon_code,
        discount_amount,
        status
    )
    VALUES (
        auth.uid(),
        new_order_number,
        p_total_amount,
        p_shipping_details,
        p_payment_method,
        p_transaction_details,
        p_coupon_code,
        p_discount_amount,
        p_initial_status::public.order_status
    )
    RETURNING id INTO new_order_id;

    -- Insert order items
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id bigint, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, item.product_id, item.quantity, item.price);
        
        -- Decrement stock
        UPDATE public.products
        SET stock = stock - item.quantity
        WHERE id = item.product_id;
    END LOOP;

    RETURN new_order_number;
END;
$$;


CREATE OR REPLACE FUNCTION public.log_order_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.order_history (order_id, status)
    VALUES (NEW.id, NEW.status);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_order_status_change
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.log_order_history();

CREATE OR REPLACE TRIGGER trigger_order_creation
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_history();

CREATE OR REPLACE FUNCTION public.update_order_status_and_log(p_order_id bigint, p_new_status text)
RETURNS SETOF orders
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.orders
    SET status = p_new_status::public.order_status
    WHERE id = p_order_id;

    RETURN QUERY SELECT * FROM public.orders WHERE id = p_order_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_all_settings()
RETURNS TABLE(settings json)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
    SELECT json_object_agg(key, value)
    FROM public.settings;
END;
$$;

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON "public"."profiles";
CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON "public"."profiles";
CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile." ON "public"."profiles";
CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."categories";
CREATE POLICY "Enable read access for all users" ON public.categories FOR SELECT USING (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."products";
CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."product_categories";
CREATE POLICY "Enable read access for all users" ON public.product_categories FOR SELECT USING (true);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."tags";
CREATE POLICY "Enable read access for all users" ON public.tags FOR SELECT USING (true);

ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."product_tags";
CREATE POLICY "Enable read access for all users" ON public.product_tags FOR SELECT USING (true);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."reviews";
CREATE POLICY "Enable read access for all users" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own reviews" ON "public"."reviews";
CREATE POLICY "Users can insert their own reviews" ON "public"."reviews" FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."questions";
CREATE POLICY "Enable read access for all users" ON public.questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own questions" ON "public"."questions";
CREATE POLICY "Users can insert their own questions" ON "public"."questions" FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own orders" ON "public"."orders";
CREATE POLICY "Users can view their own orders" ON "public"."orders" FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create orders" ON "public"."orders";
CREATE POLICY "Users can create orders" ON "public"."orders" FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view items in their own orders" ON "public"."order_items";
CREATE POLICY "Users can view items in their own orders" ON "public"."order_items" FOR SELECT USING (
  (SELECT user_id FROM public.orders WHERE id = order_id) = auth.uid()
);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own refunds" ON "public"."refunds";
CREATE POLICY "Users can view their own refunds" ON public.refunds FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create refund requests" ON "public"."refunds";
CREATE POLICY "Users can create refund requests" ON public.refunds FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can cancel their own PENDING refund requests" ON "public"."refunds";
CREATE POLICY "Users can cancel their own PENDING refund requests" ON "public"."refunds" FOR DELETE USING (auth.uid() = user_id AND status = 'Pending');

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."wishlist";
CREATE POLICY "Enable read access for all users" ON public.wishlist FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON "public"."wishlist";
CREATE POLICY "Users can manage their own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."settings";
CREATE POLICY "Enable read access for all users" ON public.settings FOR SELECT USING (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON "public"."notifications";
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own notifications" ON "public"."notifications";
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert for contact messages" ON "public"."contact_messages";
CREATE POLICY "Allow public insert for contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."offers";
CREATE POLICY "Enable read access for all users" ON public.offers FOR SELECT USING (true);

ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."promos";
CREATE POLICY "Enable read access for all users" ON public.promos FOR SELECT USING (true);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."pages";
CREATE POLICY "Enable read access for all users" ON public.pages FOR SELECT USING (true);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own addresses" ON "public"."addresses";
CREATE POLICY "Users can manage their own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own cards" ON "public"."cards";
CREATE POLICY "Users can manage their own cards" ON public.cards FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."home_page_sections";
CREATE POLICY "Enable read access for all users" ON public.home_page_sections FOR SELECT USING (true);

ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow user to read own order history" ON "public"."order_history";
CREATE POLICY "Allow user to read own order history" ON "public"."order_history" FOR SELECT USING (
  (SELECT user_id FROM public.orders WHERE id = order_id) = auth.uid()
);

-- Note: Admin/Manager policies should be more restrictive and are omitted for simplicity.
-- In a production environment, you would add policies like this:
-- CREATE POLICY "Admins have full access" ON public.products FOR ALL
--   USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super-admin') );
-- CREATE POLICY "Managers can update products" ON public.products FOR UPDATE
--   USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'manager' );

