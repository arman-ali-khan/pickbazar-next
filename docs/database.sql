-- =================================================================
-- KARWANBAZAR - DATABASE MIGRATION SCRIPT
--
-- This script fixes and aligns all database functions, triggers,
-- and policies. It is idempotent, meaning it is safe to run
-- multiple times without causing "already exists" errors.
--
-- Running this script will:
--   1. Replace all custom functions with their corrected versions.
--   2. Drop and recreate all Row Level Security (RLS) policies.
--   3. Ensure all necessary triggers are correctly configured.
-- =================================================================

-- Recreate Types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM (
            'Pending',
            'Processing',
            'Shipped',
            'Delivered',
            'Cancelled'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'address_type') THEN
        CREATE TYPE public.address_type AS ENUM (
            'billing',
            'shipping'
        );
    END IF;
END$$;


-- ----------------------------------------------------------------
-- FUNCTIONS & TRIGGERS
-- Using CREATE OR REPLACE to ensure idempotency.
-- ----------------------------------------------------------------

-- Function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log order status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- This function now only logs if the status has actually changed.
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.order_history (order_id, status)
        VALUES (NEW.id, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order status changes
DROP TRIGGER IF EXISTS after_order_update_log_status ON public.orders;
CREATE TRIGGER after_order_update_log_status
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.log_order_status_change();

-- Function to log initial order status
CREATE OR REPLACE FUNCTION public.log_initial_order_status()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.order_history (order_id, status)
    VALUES (NEW.id, NEW.status);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new orders
DROP TRIGGER IF EXISTS after_order_insert_log_status ON public.orders;
CREATE TRIGGER after_order_insert_log_status
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.log_initial_order_status();


-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Dropping and recreating all policies to prevent "already exists" errors.
-- ----------------------------------------------------------------

-- Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin_or_super());

-- Addresses Table
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own addresses." ON public.addresses;
CREATE POLICY "Users can view their own addresses." ON public.addresses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own addresses." ON public.addresses;
CREATE POLICY "Users can insert their own addresses." ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own addresses." ON public.addresses;
CREATE POLICY "Users can update their own addresses." ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own addresses." ON public.addresses;
CREATE POLICY "Users can delete their own addresses." ON public.addresses FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all addresses." ON public.addresses;
CREATE POLICY "Admins can manage all addresses." ON public.addresses FOR ALL USING (public.is_admin_or_super());

-- Cards Table
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own cards" ON public.cards;
CREATE POLICY "Users can manage their own cards" ON public.cards FOR ALL USING (auth.uid() = user_id);

-- Contact Messages Table
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages FOR ALL USING (public.is_admin_or_super());
DROP POLICY IF EXISTS "Allow public insert for contact messages" ON public.contact_messages;
CREATE POLICY "Allow public insert for contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- Notifications Table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
CREATE POLICY "Users can view their own notifications." ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own notifications (e.g., mark as read)." ON public.notifications;
CREATE POLICY "Users can update their own notifications (e.g., mark as read)." ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT USING (public.is_admin_or_super());
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT WITH CHECK (public.is_admin_or_super());

-- Orders Table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own orders." ON public.orders;
CREATE POLICY "Users can view their own orders." ON public.orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all orders." ON public.orders;
CREATE POLICY "Admins can manage all orders." ON public.orders FOR ALL USING (public.is_admin_or_super());

-- Refunds Table
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own refund requests." ON public.refunds;
CREATE POLICY "Users can view their own refund requests." ON public.refunds FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create refund requests for their own orders." ON public.refunds;
CREATE POLICY "Users can create refund requests for their own orders." ON public.refunds FOR INSERT WITH CHECK (auth.uid() = user_id AND (SELECT user_id FROM orders WHERE id = order_id) = auth.uid());
DROP POLICY IF EXISTS "Users can cancel their own PENDING refund requests." ON public.refunds;
CREATE POLICY "Users can cancel their own PENDING refund requests." ON public.refunds FOR DELETE USING (auth.uid() = user_id AND status = 'Pending');
DROP POLICY IF EXISTS "Admins can manage all refund requests." ON public.refunds;
CREATE POLICY "Admins can manage all refund requests." ON public.refunds FOR ALL USING (public.is_admin_or_super());

-- Reviews Table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are public once approved." ON public.reviews;
CREATE POLICY "Reviews are public once approved." ON public.reviews FOR SELECT USING (status = 'Approved');
DROP POLICY IF EXISTS "Users can manage their own reviews." ON public.reviews;
CREATE POLICY "Users can manage their own reviews." ON public.reviews FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all reviews." ON public.reviews;
CREATE POLICY "Admins can manage all reviews." ON public.reviews FOR ALL USING (public.is_admin_or_super());

-- Questions Table
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Answered questions are public." ON public.questions;
CREATE POLICY "Answered questions are public." ON public.questions FOR SELECT USING (status = 'Answered');
DROP POLICY IF EXISTS "Users can create questions." ON public.questions;
CREATE POLICY "Users can create questions." ON public.questions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can manage all questions." ON public.questions;
CREATE POLICY "Admins can manage all questions." ON public.questions FOR ALL USING (public.is_admin_or_super());

-- Wishlist Table
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own wishlist." ON public.wishlist;
CREATE POLICY "Users can manage their own wishlist." ON public.wishlist FOR ALL USING (auth.uid() = user_id);

-- Make all other tables publicly readable
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are publicly viewable." ON public.categories;
CREATE POLICY "Categories are publicly viewable." ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage categories." ON public.categories;
CREATE POLICY "Admins can manage categories." ON public.categories FOR ALL USING (public.is_admin_or_super());

ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Home page sections are public." ON public.home_page_sections;
CREATE POLICY "Home page sections are public." ON public.home_page_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage home page sections." ON public.home_page_sections;
CREATE POLICY "Admins can manage home page sections." ON public.home_page_sections FOR ALL USING (public.is_admin_or_super());

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Offers are public." ON public.offers;
CREATE POLICY "Offers are public." ON public.offers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage offers." ON public.offers;
CREATE POLICY "Admins can manage offers." ON public.offers FOR ALL USING (public.is_admin_or_super());

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pages are public." ON public.pages;
CREATE POLICY "Pages are public." ON public.pages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage pages." ON public.pages;
CREATE POLICY "Admins can manage pages." ON public.pages FOR ALL USING (public.is_admin_or_super());

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active products are public." ON public.products;
CREATE POLICY "Active products are public." ON public.products FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "Admins can manage products." ON public.products;
CREATE POLICY "Admins can manage products." ON public.products FOR ALL USING (public.is_admin_or_super());

ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Promos are public." ON public.promos;
CREATE POLICY "Promos are public." ON public.promos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage promos." ON public.promos;
CREATE POLICY "Admins can manage promos." ON public.promos FOR ALL USING (public.is_admin_or_super());

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings are public." ON public.settings;
CREATE POLICY "Settings are public." ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage settings." ON public.settings;
CREATE POLICY "Admins can manage settings." ON public.settings FOR ALL USING (public.is_admin_or_super());

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tags are public." ON public.tags;
CREATE POLICY "Tags are public." ON public.tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage tags." ON public.tags;
CREATE POLICY "Admins can manage tags." ON public.tags FOR ALL USING (public.is_admin_or_super());

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Product-category links are public." ON public.product_categories;
CREATE POLICY "Product-category links are public." ON public.product_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage product-category links." ON public.product_categories;
CREATE POLICY "Admins can manage product-category links." ON public.product_categories FOR ALL USING (public.is_admin_or_super());

ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Product-tag links are public." ON public.product_tags;
CREATE POLICY "Product-tag links are public." ON public.product_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage product-tag links." ON public.product_tags;
CREATE POLICY "Admins can manage product-tag links." ON public.product_tags FOR ALL USING (public.is_admin_or_super());

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own order items." ON public.order_items;
CREATE POLICY "Users can view their own order items." ON public.order_items FOR SELECT USING ((SELECT user_id FROM orders WHERE id = order_id) = auth.uid());
DROP POLICY IF EXISTS "Admins can view all order items." ON public.order_items;
CREATE POLICY "Admins can view all order items." ON public.order_items FOR SELECT USING (public.is_admin_or_super());

-- ----------------------------------------------------------------
-- RPC FUNCTIONS
-- Recreating all functions to ensure they are correct.
-- ----------------------------------------------------------------

-- Function to check if a user is an admin or super-admin
CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super-admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get related products (More resilient version)
CREATE OR REPLACE FUNCTION get_related_products(p_id integer, p_limit integer)
RETURNS TABLE(
    id integer,
    name text,
    price double precision,
    original_price double precision,
    featured_image_url text,
    unit text
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH product_base_category AS (
        SELECT c.id
        FROM categories c
        JOIN product_categories pc ON c.id = pc.category_id
        WHERE pc.product_id = p_id
        LIMIT 1
    )
    SELECT
        p.id,
        p.name,
        p.price,
        p.original_price,
        p.featured_image_url,
        p.unit
    FROM products p
    JOIN product_categories pc ON p.id = pc.product_id
    WHERE p.id != p_id AND p.status = 'active'
    AND pc.category_id = (SELECT id FROM product_base_category)
    ORDER BY p.view_count DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- Function to get recommended products (More resilient version)
CREATE OR REPLACE FUNCTION get_recommended_products(p_limit integer)
RETURNS TABLE(
    id integer,
    name text,
    price double precision,
    original_price double precision,
    featured_image_url text,
    unit text
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH product_scores AS (
        SELECT
            p.id,
            p.created_at,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) as sales_count,
            (SELECT COUNT(*) FROM wishlist w WHERE w.product_id = p.id) as wishlist_count,
            COALESCE(p.view_count, 0) as view_count
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
        (ps.sales_count * 0.5) + (ps.wishlist_count * 0.3) + (ps.view_count * 0.2) DESC,
        ps.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- Function to get admin order details (Corrected structure)
CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount double precision,
    status order_status,
    shipping_details jsonb,
    coupon_code text,
    discount_amount double precision,
    payment_method text,
    transaction_details jsonb,
    profiles jsonb,
    order_items jsonb
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        o.shipping_details,
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.payment_details as transaction_details,
        jsonb_build_object(
            'full_name', prof.full_name,
            'avatar_url', prof.avatar_url
        ) as profiles,
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', oi.id,
                'quantity', oi.quantity,
                'price_at_purchase', oi.price,
                'products', jsonb_build_object(
                    'name', p.name,
                    'featured_image_url', p.featured_image_url
                )
            )
        )
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = o.id) as order_items
    FROM orders o
    LEFT JOIN profiles prof ON o.user_id = prof.id
    WHERE o.order_number = p_order_number;
END;
$$ LANGUAGE plpgsql;

-- Other RPC functions
CREATE OR REPLACE FUNCTION public.update_order_status_and_log(p_order_id bigint, p_new_status public.order_status)
RETURNS TABLE (
    id bigint,
    order_number text,
    user_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.orders
    SET status = p_new_status
    WHERE orders.id = p_order_id;

    RETURN QUERY
    SELECT o.id, o.order_number, o.user_id
    FROM public.orders o
    WHERE o.id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    role text,
    created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT p.id, p.full_name, u.email, p.avatar_url, p.role, u.created_at
    FROM auth.users u
    JOIN public.profiles p ON u.id = p.id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_wishlist_ids(p_user_id uuid)
RETURNS TABLE (product_id integer)
LANGUAGE sql
AS $$
    SELECT product_id FROM wishlist WHERE user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.toggle_wishlist_item(p_user_id uuid, p_product_id integer)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    is_wishlisted boolean;
    result_status text;
BEGIN
    SELECT EXISTS(SELECT 1 FROM wishlist WHERE user_id = p_user_id AND product_id = p_product_id) INTO is_wishlisted;

    IF is_wishlisted THEN
        DELETE FROM wishlist WHERE user_id = p_user_id AND product_id = p_product_id;
        result_status := 'removed';
    ELSE
        INSERT INTO wishlist (user_id, product_id) VALUES (p_user_id, p_product_id);
        result_status := 'added';
    END IF;

    RETURN json_build_object('status', result_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_contact_messages()
RETURNS TABLE (
    id bigint,
    "senderName" text,
    senderemail text,
    subject text,
    message text,
    date timestamp with time zone,
    status text
)
LANGUAGE sql
AS $$
    SELECT id, name as "senderName", email as senderemail, subject, message, created_at as date, status FROM contact_messages ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_contact_message_details(p_message_id integer)
RETURNS TABLE (
    id bigint,
    "senderName" text,
    "senderEmail" text,
    subject text,
    message text,
    date timestamp with time zone,
    status text,
    avatar jsonb
)
LANGUAGE sql
AS $$
    SELECT
        id,
        name as "senderName",
        email as "senderEmail",
        subject,
        message,
        created_at as date,
        status,
        json_build_object('imageUrl', null, 'imageHint', 'person') as avatar
    FROM contact_messages
    WHERE contact_messages.id = p_message_id;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_reviews()
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
SECURITY DEFINER
AS $$
    SELECT
        r.id,
        r.rating,
        r.text,
        r.status,
        r.created_at,
        json_build_object('name', p.full_name, 'avatar_url', p.avatar_url) as author,
        json_build_object('id', pr.id, 'name', pr.name, 'featured_image_url', pr.featured_image_url) as product
    FROM reviews r
    JOIN profiles p ON r.user_id = p.id
    JOIN products pr ON r.product_id = pr.id
    ORDER BY r.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_questions()
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
SECURITY DEFINER
AS $$
    SELECT
        q.id,
        q.question_text as question,
        q.answer_text as answer,
        q.status,
        q.created_at as date,
        json_build_object('name', p.full_name, 'avatar', jsonb_build_object('imageUrl', p.avatar_url, 'imageHint', 'person face')) as author,
        json_build_object('id', pr.id, 'name', pr.name, 'image', jsonb_build_object('imageUrl', pr.featured_image_url, 'imageHint', 'product')) as product
    FROM questions q
    JOIN profiles p ON q.user_id = p.id
    JOIN products pr ON q.product_id = pr.id
    ORDER BY q.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_question_details(p_question_id integer)
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
SECURITY DEFINER
AS $$
    SELECT
        q.id,
        q.question_text as question,
        q.answer_text as answer,
        q.status,
        q.created_at as date,
        json_build_object('name', p.full_name, 'avatar', jsonb_build_object('imageUrl', p.avatar_url, 'imageHint', 'person face')) as author,
        json_build_object('id', pr.id, 'name', pr.name, 'image', jsonb_build_object('imageUrl', pr.featured_image_url, 'imageHint', 'product')) as product
    FROM questions q
    JOIN profiles p ON q.user_id = p.id
    JOIN products pr ON q.product_id = pr.id
    WHERE q.id = p_question_id;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_refunds()
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
SECURITY DEFINER
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
    FROM refunds r
    JOIN profiles p ON r.user_id = p.id
    JOIN orders o ON r.order_id = o.id
    ORDER BY r.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount double precision,
    status order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        p.full_name as customer_name,
        (o.shipping_details->>'email') as customer_email,
        p.avatar_url as customer_avatar_url
    FROM orders o
    LEFT JOIN profiles p ON o.user_id = p.id
    ORDER BY o.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.update_home_sections(sections_data jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete all existing sections
    DELETE FROM public.home_page_sections;
    -- Insert new sections from the provided JSON
    INSERT INTO public.home_page_sections (category_id, display_order)
    SELECT
        (value->>'category_id')::int,
        (value->>'display_order')::int
    FROM jsonb_array_elements(sections_data);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_settings()
RETURNS TABLE (
    site_title text,
    site_subtitle text,
    logo_url text,
    favicon_url text,
    link_preview_image_url text,
    meta_title text,
    meta_description text,
    meta_tags text,
    canonical_url text,
    og_title text,
    og_description text,
    enable_cod boolean,
    enable_mobile_banking boolean,
    enable_card_payment boolean,
    maintenance_mode boolean,
    maintenance_title text,
    maintenance_description text,
    maintenance_cover_image_url text,
    maintenance_end_date text,
    enable_promo_popup boolean,
    social_links json,
    mobile_banking_number text,
    mobile_banking_options text[],
    shipping_cost numeric
)
LANGUAGE sql
AS $$
    SELECT
        (SELECT value FROM settings WHERE key = 'site_title'),
        (SELECT value FROM settings WHERE key = 'site_subtitle'),
        (SELECT value FROM settings WHERE key = 'logo_url'),
        (SELECT value FROM settings WHERE key = 'favicon_url'),
        (SELECT value FROM settings WHERE key = 'link_preview_image_url'),
        (SELECT value FROM settings WHERE key = 'meta_title'),
        (SELECT value FROM settings WHERE key = 'meta_description'),
        (SELECT value FROM settings WHERE key = 'meta_tags'),
        (SELECT value FROM settings WHERE key = 'canonical_url'),
        (SELECT value FROM settings WHERE key = 'og_title'),
        (SELECT value FROM settings WHERE key = 'og_description'),
        (SELECT value FROM settings WHERE key = 'enable_cod')::boolean,
        (SELECT value FROM settings WHERE key = 'enable_mobile_banking')::boolean,
        (SELECT value FROM settings WHERE key = 'enable_card_payment')::boolean,
        (SELECT value FROM settings WHERE key = 'maintenance_mode')::boolean,
        (SELECT value FROM settings WHERE key = 'maintenance_title'),
        (SELECT value FROM settings WHERE key = 'maintenance_description'),
        (SELECT value FROM settings WHERE key = 'maintenance_cover_image_url'),
        (SELECT value FROM settings WHERE key = 'maintenance_end_date'),
        (SELECT value FROM settings WHERE key = 'enable_promo_popup')::boolean,
        (SELECT value FROM settings WHERE key = 'social_links')::json,
        (SELECT value FROM settings WHERE key = 'mobile_banking_number'),
        (SELECT value::text[] FROM settings WHERE key = 'mobile_banking_options'),
        (SELECT value::numeric FROM settings WHERE key = 'shipping_cost')
$$;

CREATE OR REPLACE FUNCTION public.get_user_reviews(p_user_id uuid)
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
        p.name as product_name,
        p.featured_image_url as product_image,
        p.id as product_id
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE r.user_id = p_user_id
    ORDER BY r.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_user_questions(p_user_id uuid)
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
    FROM questions q
    JOIN products p ON q.product_id = p.id
    WHERE q.user_id = p_user_id
    ORDER BY q.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_user_refunds(p_user_id uuid)
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
    FROM refunds r
    JOIN orders o ON r.order_id = o.id
    WHERE r.user_id = p_user_id
    ORDER BY r.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_user_transactions(p_user_id uuid)
RETURNS TABLE(
    id bigint,
    order_id bigint,
    order_number text,
    amount double precision,
    payment_method text,
    status text,
    created_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.order_id,
        o.order_number,
        t.amount,
        t.payment_method,
        t.status::text,
        t.created_at
    FROM
        transactions t
    JOIN
        orders o ON t.order_id = o.id
    WHERE
        o.user_id = p_user_id
    ORDER BY
        t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.increment_product_view(product_id_to_inc integer)
RETURNS void
LANGUAGE sql
AS $$
    UPDATE products
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = product_id_to_inc;
$$;

CREATE OR REPLACE FUNCTION public.get_category_tree()
RETURNS TABLE (name text, subcategories text[])
LANGUAGE sql
AS $$
    WITH RECURSIVE category_tree AS (
      SELECT id, name, parent_id, ARRAY[name] AS path
      FROM categories
      WHERE parent_id IS NULL

      UNION ALL

      SELECT c.id, c.name, c.parent_id, ct.path || c.name
      FROM categories c
      JOIN category_tree ct ON c.parent_id = ct.id
    )
    SELECT
        t1.name,
        ARRAY_AGG(t2.name) as subcategories
    FROM category_tree t1
    LEFT JOIN category_tree t2 ON t2.path[1] = t1.name AND ARRAY_LENGTH(t2.path, 1) > 1
    WHERE ARRAY_LENGTH(t1.path, 1) = 1
    GROUP BY t1.name
    ORDER BY t1.name;
$$;

CREATE OR REPLACE FUNCTION public.get_product_reviews(p_product_id integer)
RETURNS TABLE (
    id bigint,
    rating integer,
    text text,
    created_at timestamp with time zone,
    author_name text,
    author_avatar text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        r.id,
        r.rating,
        r.text,
        r.created_at,
        p.full_name as author_name,
        p.avatar_url as author_avatar
    FROM reviews r
    JOIN profiles p ON r.user_id = p.id
    WHERE r.product_id = p_product_id AND r.status = 'Approved'
    ORDER BY r.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_product_rating_stats(p_product_id integer)
RETURNS TABLE (
    total_reviews bigint,
    avg_rating numeric,
    rating_distribution jsonb
)
LANGUAGE sql
AS $$
    WITH review_stats AS (
      SELECT
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating
      FROM reviews
      WHERE product_id = p_product_id AND status = 'Approved'
    ),
    rating_counts AS (
      SELECT
        rating,
        COUNT(*) as count
      FROM reviews
      WHERE product_id = p_product_id AND status = 'Approved'
      GROUP BY rating
    )
    SELECT
      rs.total_reviews,
      rs.avg_rating,
      jsonb_agg(jsonb_build_object('rating', rc.rating, 'count', rc.count))
    FROM review_stats rs, rating_counts rc
    GROUP BY rs.total_reviews, rs.avg_rating;
$$;


CREATE OR REPLACE FUNCTION public.get_product_questions(p_product_id integer)
RETURNS TABLE (
    id bigint,
    question_text text,
    answer_text text,
    created_at timestamp with time zone,
    author_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        q.id,
        q.question_text,
        q.answer_text,
        q.created_at,
        p.full_name as author_name
    FROM questions q
    JOIN profiles p ON q.user_id = p.id
    WHERE q.product_id = p_product_id AND q.status = 'Answered'
    ORDER BY q.created_at DESC;
$$;


CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount double precision,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount double precision,
    p_initial_status order_status
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
    -- Determine the user ID
    DECLARE
        v_user_id uuid := auth.uid();
    BEGIN

    -- Generate a unique order number
    new_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || LPAD(nextval('order_number_seq')::text, 5, '0');

    -- Insert the order
    INSERT INTO public.orders(user_id, order_number, total_amount, shipping_details, payment_method, payment_details, coupon_code, discount_amount, status)
    VALUES (v_user_id, new_order_number, p_total_amount, p_shipping_details, p_payment_method, p_transaction_details, p_coupon_code, p_discount_amount, p_initial_status)
    RETURNING id INTO new_order_id;

    -- Insert order items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items(order_id, product_id, quantity, price)
        VALUES (new_order_id, (item->>'product_id')::int, (item->>'quantity')::int, (item->>'price')::numeric);

        -- Decrement stock
        UPDATE public.products
        SET stock = stock - (item->>'quantity')::int
        WHERE id = (item->>'product_id')::int;
    END LOOP;

    -- Create a transaction record
    INSERT INTO public.transactions(order_id, amount, payment_method, status, transaction_details)
    VALUES (new_order_id, p_total_amount, p_payment_method, 'Pending', p_transaction_details);


    RETURN new_order_number;

    END;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_order_history(p_order_id bigint)
RETURNS TABLE (
    status text,
    created_at timestamp with time zone
)
LANGUAGE sql
AS $$
    SELECT status, created_at FROM order_history WHERE order_id = p_order_id ORDER BY created_at ASC;
$$;
