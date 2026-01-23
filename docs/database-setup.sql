
-- Temporarily disable security policies that depend on functions
ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE refunds DISABLE ROW LEVEL SECURITY;

-- Drop existing objects with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS get_admin_notifications() CASCADE;
DROP FUNCTION IF EXISTS handle_new_review() CASCADE;
DROP FUNCTION IF EXISTS handle_new_contact_message() CASCADE;
DROP FUNCTION IF EXISTS handle_new_order() CASCADE;
DROP TRIGGER IF EXISTS on_new_review ON reviews CASCADE;
DROP TRIGGER IF EXISTS on_new_contact_message ON contact_messages CASCADE;
DROP TRIGGER IF EXISTS on_new_order ON orders CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

DROP FUNCTION IF EXISTS get_all_users() CASCADE;
DROP FUNCTION IF EXISTS get_admins() CASCADE;
DROP FUNCTION IF EXISTS get_potential_admins() CASCADE;
DROP FUNCTION IF EXISTS get_user_details(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_my_role() CASCADE;
DROP FUNCTION IF EXISTS is_admin(uuid) CASCADE;

DROP FUNCTION IF EXISTS get_admin_reviews() CASCADE;
DROP FUNCTION IF EXISTS get_product_rating_stats(integer) CASCADE;
DROP FUNCTION IF EXISTS get_product_reviews(integer) CASCADE;
DROP FUNCTION IF EXISTS get_user_reviews(uuid) CASCADE;

DROP FUNCTION IF EXISTS get_admin_questions() CASCADE;
DROP FUNCTION IF EXISTS get_admin_question_details(integer) CASCADE;
DROP FUNCTION IF EXISTS get_product_questions(integer) CASCADE;
DROP FUNCTION IF EXISTS get_user_questions(uuid) CASCADE;

DROP FUNCTION IF EXISTS get_contact_messages() CASCADE;
DROP FUNCTION IF EXISTS get_contact_message_details(integer) CASCADE;

DROP FUNCTION IF EXISTS get_all_settings() CASCADE;

DROP FUNCTION IF EXISTS get_admin_refunds() CASCADE;
DROP FUNCTION IF EXISTS get_user_refunds(uuid) CASCADE;

DROP FUNCTION IF EXISTS get_admin_transactions() CASCADE;
DROP FUNCTION IF EXISTS get_user_transactions(uuid) CASCADE;

DROP FUNCTION IF EXISTS get_admin_order_details(text) CASCADE;
DROP FUNCTION IF EXISTS get_admin_orders() CASCADE;
DROP FUNCTION IF EXISTS create_order(uuid,numeric,jsonb,jsonb,text,jsonb,text,numeric) CASCADE;
DROP FUNCTION IF EXISTS create_order(uuid,integer,numeric,jsonb,jsonb,text,jsonb,text,numeric) CASCADE;
DROP FUNCTION IF EXISTS create_order(uuid,integer,numeric,jsonb,jsonb,text,text,numeric) CASCADE;

DROP FUNCTION IF EXISTS update_home_sections(jsonb) CASCADE;
DROP FUNCTION IF EXISTS get_category_tree() CASCADE;
DROP FUNCTION IF EXISTS get_related_products(integer, integer) CASCADE;
DROP FUNCTION IF EXISTS increment_product_view(integer) CASCADE;

-- Drop tables and types in a safe order
DROP TABLE IF EXISTS reviews CASCADE;
DROP TYPE IF EXISTS review_status CASCADE;
DROP TABLE IF EXISTS product_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS home_page_sections CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS non_users CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Start creating objects from scratch

-- Enum Types
CREATE TYPE user_role AS ENUM ('customer', 'manager', 'admin', 'super-admin');
CREATE TYPE order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled');
CREATE TYPE transaction_status AS ENUM ('Pending', 'Completed', 'Failed');
CREATE TYPE offer_status AS ENUM ('active', 'inactive', 'expired');
CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE review_status AS ENUM ('Pending', 'Approved', 'Hidden');
CREATE TYPE address_type AS ENUM ('billing', 'shipping');
CREATE TYPE refund_status AS ENUM ('Pending', 'Approved', 'Rejected');
CREATE TYPE message_status AS ENUM ('read', 'unread');
CREATE TYPE notification_type AS ENUM ('new_order', 'new_review', 'new_message');

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    contact_number TEXT,
    role user_role NOT NULL DEFAULT 'customer'
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    featured_image_url TEXT,
    gallery_urls TEXT[],
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    original_price NUMERIC(10, 2),
    stock INT NOT NULL DEFAULT 0,
    unit TEXT,
    status product_status NOT NULL DEFAULT 'draft',
    view_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Non-Users Table for Guest Checkout
CREATE TABLE IF NOT EXISTS non_users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    shipping_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    non_user_id INT REFERENCES non_users(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL UNIQUE,
    total_amount NUMERIC(10, 2) NOT NULL,
    status order_status NOT NULL DEFAULT 'Pending',
    shipping_details JSONB,
    coupon_code TEXT,
    discount_amount NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
    quantity INT NOT NULL,
    price_at_purchase NUMERIC(10, 2) NOT NULL
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    non_user_id INT REFERENCES non_users(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    status transaction_status NOT NULL DEFAULT 'Pending',
    transaction_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    parent_id INT REFERENCES categories(id) ON DELETE CASCADE
);

-- Product Categories Junction Table
CREATE TABLE IF NOT EXISTS product_categories (
    product_id INT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (product_id, category_id)
);

-- Tags Table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE
);

-- Product Tags Junction Table
CREATE TABLE IF NOT EXISTS product_tags (
    product_id INT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    tag_id INT REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (product_id, tag_id)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id INT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT,
    status review_status NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id INT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    answer_text TEXT,
    status order_status NOT NULL DEFAULT 'Pending',
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Addresses Table
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    address_type address_type NOT NULL,
    title TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip TEXT NOT NULL,
    street_address TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cards Table
CREATE TABLE IF NOT EXISTS cards (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    card_type TEXT NOT NULL,
    last4 TEXT NOT NULL,
    expiry_month INT NOT NULL,
    expiry_year INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Offers Table
CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    code TEXT NOT NULL UNIQUE,
    discount_percentage NUMERIC(5, 2) NOT NULL,
    status offer_status NOT NULL DEFAULT 'active',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    image_url TEXT,
    category_ids INT[],
    product_ids INT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Home Page Sections Table
CREATE TABLE IF NOT EXISTS home_page_sections (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    display_order INT NOT NULL UNIQUE
);

-- Refunds Table
CREATE TABLE IF NOT EXISTS refunds (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    status refund_status NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status message_status NOT NULL DEFAULT 'unread',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Can be null for system-wide notifications
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Functions and Triggers --

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role user_role;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = p_user_id;
    RETURN user_role IN ('admin', 'manager', 'super-admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for a user to get their own role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TABLE (role user_role) AS $$
BEGIN
    RETURN QUERY
    SELECT p.role FROM profiles p WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Function to create a user profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle creating an order (for both registered and guest users)
CREATE OR REPLACE FUNCTION create_order(
    p_user_id UUID,
    p_non_user_id INT,
    p_total_amount NUMERIC,
    p_shipping_details JSONB,
    p_items JSONB,
    p_payment_method TEXT,
    p_transaction_details JSONB,
    p_coupon_code TEXT,
    p_discount_amount NUMERIC
)
RETURNS TEXT AS $$
DECLARE
    new_order_id INT;
    order_number TEXT;
    item JSONB;
BEGIN
    -- Generate a unique order number
    order_number := 'PB-' || to_char(NOW(), 'YYMMDD') || '-' || LPAD(nextval('orders_id_seq')::TEXT, 6, '0');

    -- Insert into orders table
    INSERT INTO orders (user_id, non_user_id, order_number, total_amount, status, shipping_details, coupon_code, discount_amount)
    VALUES (p_user_id, p_non_user_id, order_number, p_total_amount, 'Pending', p_shipping_details, p_coupon_code, p_discount_amount)
    RETURNING id INTO new_order_id;

    -- Insert into order_items table
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, (item->>'product_id')::INT, (item->>'quantity')::INT, (item->>'price')::NUMERIC);
    END LOOP;

    -- Insert into transactions table
    INSERT INTO transactions (order_id, user_id, non_user_id, amount, payment_method, status, transaction_details)
    VALUES (new_order_id, p_user_id, p_non_user_id, p_total_amount, p_payment_method, 'Completed', p_transaction_details);

    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Function to get product reviews (approved only)
CREATE OR REPLACE FUNCTION get_product_reviews(p_product_id INT)
RETURNS TABLE (
    id INT,
    rating INT,
    text TEXT,
    created_at TIMESTAMPTZ,
    author_name TEXT,
    author_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.rating,
        r.text,
        r.created_at,
        p.full_name AS author_name,
        p.avatar_url AS author_avatar
    FROM reviews r
    JOIN profiles p ON r.user_id = p.id
    WHERE r.product_id = p_product_id AND r.status = 'Approved'::review_status
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get product rating statistics
CREATE OR REPLACE FUNCTION get_product_rating_stats(p_product_id INT)
RETURNS TABLE (
    total_reviews BIGINT,
    avg_rating NUMERIC,
    rating_distribution JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) AS total_reviews,
        COALESCE(AVG(rating), 0) AS avg_rating,
        (
            SELECT json_agg(t)
            FROM (
                SELECT
                    stars.rating,
                    COALESCE(COUNT(r.id), 0) AS count
                FROM (SELECT generate_series(1, 5) AS rating) AS stars
                LEFT JOIN reviews r
                    ON r.product_id = p_product_id
                    AND r.rating = stars.rating
                    AND r.status = 'Approved'::review_status
                GROUP BY stars.rating
                ORDER BY stars.rating DESC
            ) t
        ) AS rating_distribution
    FROM reviews
    WHERE product_id = p_product_id AND status = 'Approved'::review_status;
END;
$$ LANGUAGE plpgsql;

-- Function to get related products
CREATE OR REPLACE FUNCTION get_related_products(p_id INT, p_limit INT)
RETURNS TABLE (
    id INT,
    name TEXT,
    price NUMERIC,
    original_price NUMERIC,
    featured_image_url TEXT,
    unit TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH product_categories AS (
        SELECT category_id FROM product_categories WHERE product_id = p_id
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
    WHERE pc.category_id IN (SELECT category_id FROM product_categories)
      AND p.id != p_id
    GROUP BY p.id
    ORDER BY random() -- Or a more sophisticated recommendation logic
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to increment product view count
CREATE OR REPLACE FUNCTION increment_product_view(product_id_to_inc INT)
RETURNS void AS $$
    UPDATE products
    SET view_count = view_count + 1
    WHERE id = product_id_to_inc;
$$ LANGUAGE sql;

-- Function to get all categories in a hierarchical structure
CREATE OR REPLACE FUNCTION get_category_tree()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'name', parent.name,
            'subcategories', (
                SELECT jsonb_agg(child.name)
                FROM categories AS child
                WHERE child.parent_id = parent.id
            )
        )
    )
    INTO result
    FROM categories AS parent
    WHERE parent.parent_id IS NULL;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to manage home page sections
CREATE OR REPLACE FUNCTION update_home_sections(sections_data JSONB)
RETURNS void AS $$
BEGIN
    -- Clear existing sections
    DELETE FROM home_page_sections;
    -- Insert new sections
    INSERT INTO home_page_sections (category_id, display_order)
    SELECT
        (value->>'category_id')::INT,
        (value->>'display_order')::INT
    FROM jsonb_array_elements(sections_data) AS value;
END;
$$ LANGUAGE plpgsql;

-- Function to get admin orders (for both users and non-users)
CREATE OR REPLACE FUNCTION get_admin_orders()
RETURNS TABLE (
    id INT,
    order_number TEXT,
    created_at TIMESTAMPTZ,
    total_amount NUMERIC,
    status order_status,
    customer_name TEXT,
    customer_email TEXT,
    customer_avatar_url TEXT,
    is_guest BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        COALESCE(p.full_name, (o.shipping_details->>'firstName') || ' ' || (o.shipping_details->>'lastName')) AS customer_name,
        COALESCE(u.email, nu.email) AS customer_email,
        p.avatar_url AS customer_avatar_url,
        (o.user_id IS NULL) AS is_guest
    FROM orders o
    LEFT JOIN auth.users u ON o.user_id = u.id
    LEFT JOIN profiles p ON o.user_id = p.id
    LEFT JOIN non_users nu ON o.non_user_id = nu.id
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get details for a single admin order
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number TEXT)
RETURNS TABLE (
    id INT,
    order_number TEXT,
    created_at TIMESTAMPTZ,
    total_amount NUMERIC,
    status order_status,
    shipping_details JSONB,
    profiles JSONB,
    order_items JSONB,
    coupon_code TEXT,
    discount_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        o.shipping_details,
        jsonb_build_object(
            'full_name', COALESCE(p.full_name, (o.shipping_details->>'firstName') || ' ' || (o.shipping_details->>'lastName')),
            'avatar_url', p.avatar_url
        ) AS profiles,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', oi.id,
                    'quantity', oi.quantity,
                    'price_at_purchase', oi.price_at_purchase,
                    'products', jsonb_build_object(
                        'name', prod.name,
                        'featured_image_url', prod.featured_image_url
                    )
                )
            )
            FROM order_items oi
            JOIN products prod ON oi.product_id = prod.id
            WHERE oi.order_id = o.id
        ) AS order_items,
        o.coupon_code,
        o.discount_amount
    FROM orders o
    LEFT JOIN profiles p ON o.user_id = p.id
    WHERE o.order_number = p_order_number;
END;
$$ LANGUAGE plpgsql;

-- Function to get all users with their roles
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    role user_role
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        p.full_name,
        u.email,
        p.avatar_url,
        u.created_at,
        p.role
    FROM auth.users u
    JOIN profiles p ON u.id = p.id
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Functions to get admin-related user lists
CREATE OR REPLACE FUNCTION get_admins()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    role user_role,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        u.email,
        p.role,
        p.avatar_url
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.role IN ('admin', 'manager', 'super-admin');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_potential_admins()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        u.email,
        p.avatar_url
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.role = 'customer';
END;
$$ LANGUAGE plpgsql;

-- Function to get details for a single user
CREATE OR REPLACE FUNCTION get_user_details(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    role user_role
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        p.full_name,
        u.email,
        p.avatar_url,
        u.created_at,
        p.role
    FROM auth.users u
    JOIN profiles p ON u.id = p.id
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Functions for reviews
CREATE OR REPLACE FUNCTION get_admin_reviews()
RETURNS TABLE (
    id INT,
    rating INT,
    text TEXT,
    status review_status,
    created_at TIMESTAMPTZ,
    author JSON,
    product JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.rating,
        r.text,
        r.status,
        r.created_at,
        json_build_object(
            'name', p.full_name,
            'avatar_url', p.avatar_url
        ) AS author,
        json_build_object(
            'id', prod.id,
            'name', prod.name,
            'featured_image_url', prod.featured_image_url
        ) AS product
    FROM reviews r
    JOIN profiles p ON r.user_id = p.id
    JOIN products prod ON r.product_id = prod.id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_reviews(p_user_id UUID)
RETURNS TABLE (
    id INT,
    rating INT,
    text TEXT,
    status review_status,
    created_at TIMESTAMPTZ,
    product_name TEXT,
    product_image TEXT,
    product_id INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.rating,
        r.text,
        r.status,
        r.created_at,
        p.name AS product_name,
        p.featured_image_url AS product_image,
        p.id AS product_id
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE r.user_id = p_user_id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Functions for Questions & Answers
CREATE OR REPLACE FUNCTION get_admin_questions()
RETURNS TABLE (
    id INT,
    question TEXT,
    answer TEXT,
    status order_status,
    date TIMESTAMPTZ,
    author JSON,
    product JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id,
        q.question_text AS question,
        q.answer_text AS answer,
        q.status,
        q.created_at AS date,
        json_build_object(
            'name', p.full_name,
            'avatar', json_build_object(
                'imageUrl', p.avatar_url,
                'imageHint', 'person face'
            )
        ) AS author,
        json_build_object(
            'id', prod.id,
            'name', prod.name,
            'image', json_build_object(
                'imageUrl', prod.featured_image_url,
                'imageHint', 'product'
            )
        ) AS product
    FROM questions q
    JOIN profiles p ON q.user_id = p.id
    JOIN products prod ON q.product_id = prod.id
    ORDER BY q.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_admin_question_details(p_question_id INT)
RETURNS TABLE (
    id INT,
    question TEXT,
    answer TEXT,
    status order_status,
    date TIMESTAMPTZ,
    author JSON,
    product JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM get_admin_questions() WHERE id = p_question_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_product_questions(p_product_id INT)
RETURNS TABLE (
    id INT,
    question_text TEXT,
    answer_text TEXT,
    author_name TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id,
        q.question_text,
        q.answer_text,
        p.full_name AS author_name,
        q.created_at
    FROM questions q
    JOIN profiles p ON q.user_id = p.id
    WHERE q.product_id = p_product_id AND q.status = 'Answered'
    ORDER BY q.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_questions(p_user_id UUID)
RETURNS TABLE (
    id INT,
    question_text TEXT,
    answer_text TEXT,
    status order_status,
    created_at TIMESTAMPTZ,
    product_name TEXT,
    product_id INT,
    product_image TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id,
        q.question_text,
        q.answer_text,
        q.status,
        q.created_at,
        p.name AS product_name,
        p.id AS product_id,
        p.featured_image_url AS product_image
    FROM questions q
    JOIN products p ON q.product_id = p.id
    WHERE q.user_id = p_user_id
    ORDER BY q.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Functions for Contact Messages
CREATE OR REPLACE FUNCTION get_contact_messages()
RETURNS TABLE (
    id INT,
    senderName TEXT,
    senderEmail TEXT,
    subject TEXT,
    message TEXT,
    date TIMESTAMPTZ,
    status message_status
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cm.id,
        cm.name,
        cm.email,
        cm.subject,
        cm.message,
        cm.created_at,
        cm.status
    FROM contact_messages cm
    ORDER BY cm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_contact_message_details(p_message_id INT)
RETURNS TABLE (
    id INT,
    senderName TEXT,
    senderEmail TEXT,
    subject TEXT,
    message TEXT,
    date TIMESTAMPTZ,
    status message_status,
    avatar JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cm.id,
        cm.name,
        cm.email,
        cm.subject,
        cm.message,
        cm.created_at,
        cm.status,
        json_build_object(
            'imageUrl', NULL,
            'imageHint', 'person face'
        )
    FROM contact_messages cm
    WHERE cm.id = p_message_id;
END;
$$ LANGUAGE plpgsql;


-- Functions for Refunds
CREATE OR REPLACE FUNCTION get_admin_refunds()
RETURNS TABLE (
    id INT,
    order_id INT,
    order_number TEXT,
    amount NUMERIC,
    status refund_status,
    reason TEXT,
    created_at TIMESTAMPTZ,
    user_id UUID,
    customer_name TEXT,
    customer_avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.order_id,
        o.order_number,
        r.amount,
        r.status,
        r.reason,
        r.created_at,
        r.user_id,
        p.full_name AS customer_name,
        p.avatar_url AS customer_avatar_url
    FROM refunds r
    JOIN orders o ON r.order_id = o.id
    JOIN profiles p ON r.user_id = p.id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_refunds(p_user_id UUID)
RETURNS TABLE (
    id INT,
    order_id INT,
    order_number TEXT,
    amount NUMERIC,
    status refund_status,
    reason TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
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
END;
$$ LANGUAGE plpgsql;

-- Functions for Transactions
CREATE OR REPLACE FUNCTION get_admin_transactions()
RETURNS TABLE (
    id INT,
    order_id INT,
    order_number TEXT,
    customer_name TEXT,
    customer_avatar TEXT,
    amount NUMERIC,
    payment_method TEXT,
    status transaction_status,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.order_id,
        o.order_number,
        COALESCE(p.full_name, (o.shipping_details->>'firstName') || ' ' || (o.shipping_details->>'lastName')) AS customer_name,
        p.avatar_url AS customer_avatar,
        t.amount,
        t.payment_method,
        t.status,
        t.created_at
    FROM transactions t
    JOIN orders o ON t.order_id = o.id
    LEFT JOIN profiles p ON t.user_id = p.id
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_transactions(p_user_id UUID)
RETURNS TABLE (
    id INT,
    order_id INT,
    order_number TEXT,
    amount NUMERIC,
    payment_method TEXT,
    status transaction_status,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.order_id,
        o.order_number,
        t.amount,
        t.payment_method,
        t.status,
        t.created_at
    FROM transactions t
    JOIN orders o ON t.order_id = o.id
    WHERE t.user_id = p_user_id
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql;


-- Function to get all settings as a single JSON object
CREATE OR REPLACE FUNCTION get_all_settings()
RETURNS JSON AS $$
DECLARE
    settings_json JSON;
BEGIN
    SELECT json_object_agg(key, value)
    INTO settings_json
    FROM settings;
    RETURN settings_json;
END;
$$ LANGUAGE plpgsql;

-- Functions for Notifications --
CREATE OR REPLACE FUNCTION handle_new_order()
RETURNS TRIGGER AS $$
DECLARE
    order_id INT := NEW.id;
    order_num TEXT := NEW.order_number;
BEGIN
    INSERT INTO notifications(type, title, message, link)
    VALUES('new_order', 'New Order Received', 'A new order ' || order_num || ' has been placed.', '/admin/orders/' || order_num);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_review()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications(type, title, message, link)
    VALUES('new_review', 'New Review Submitted', 'A new product review is awaiting approval.', '/admin/reviews');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_contact_message()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications(type, title, message, link)
    VALUES('new_message', 'New Contact Message', 'You have a new message from ' || NEW.name, '/admin/messages/view/' || NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_admin_notifications()
RETURNS TABLE(
    id INT,
    title TEXT,
    message TEXT,
    link TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ,
    type notification_type
) AS $$
BEGIN
    RETURN QUERY
    SELECT n.id, n.title, n.message, n.link, n.is_read, n.created_at, n.type
    FROM notifications n
    ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Triggers for Notifications
CREATE TRIGGER on_new_order AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION handle_new_order();
CREATE TRIGGER on_new_review AFTER INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION handle_new_review();
CREATE TRIGGER on_new_contact_message AFTER INSERT ON contact_messages FOR EACH ROW EXECUTE handle_new_contact_message();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for `profiles`
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for `products` and related tables (generally public read)
CREATE POLICY "Products are viewable by everyone." ON products FOR SELECT USING (true);
CREATE POLICY "Categories are viewable by everyone." ON categories FOR SELECT USING (true);
CREATE POLICY "Tags are viewable by everyone." ON tags FOR SELECT USING (true);
CREATE POLICY "Product-Category links are viewable by everyone." ON product_categories FOR SELECT USING (true);
CREATE POLICY "Product-Tag links are viewable by everyone." ON product_tags FOR SELECT USING (true);
CREATE POLICY "Home page sections are viewable by everyone." ON home_page_sections FOR SELECT USING (true);
CREATE POLICY "Offers are viewable by everyone." ON offers FOR SELECT USING (true);

-- Policies for `orders` and `order_items`
CREATE POLICY "Users can view their own orders." ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own order items." ON order_items FOR SELECT USING (
    (SELECT user_id FROM orders WHERE id = order_items.order_id) = auth.uid()
);
CREATE POLICY "Allow admin full access to orders." ON orders FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Allow admin full access to order items." ON order_items FOR ALL USING (is_admin(auth.uid()));

-- Policies for `transactions`
CREATE POLICY "Users can view their own transactions." ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow admin full access to transactions." ON transactions FOR ALL USING (is_admin(auth.uid()));

-- Policies for `reviews`
CREATE POLICY "Approved reviews are public." ON reviews FOR SELECT USING (status = 'Approved'::review_status);
CREATE POLICY "Users can manage their own reviews." ON reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all reviews." ON reviews FOR ALL USING (is_admin(auth.uid()));

-- Policies for `questions`
CREATE POLICY "Answered questions are public." ON questions FOR SELECT USING (status = 'Answered');
CREATE POLICY "Users can manage their own questions." ON questions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all questions." ON questions FOR ALL USING (is_admin(auth.uid()));

-- Policies for `addresses` and `cards`
CREATE POLICY "Users can manage their own addresses." ON addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own cards." ON cards FOR ALL USING (auth.uid() = user_id);

-- Policies for `refunds`
CREATE POLICY "Users can manage their own refund requests." ON refunds FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow admin full access to refunds." ON refunds FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can cancel their own PENDING refund." ON refunds FOR DELETE USING (auth.uid() = user_id AND status = 'Pending'::refund_status);

-- Policies for `contact_messages`
CREATE POLICY "Allow admin select for contact messages" ON contact_messages FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Allow admin update for contact messages" ON contact_messages FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Allow admin delete for contact messages" ON contact_messages FOR DELETE USING (is_admin(auth.uid()));

-- Policies for `settings`
CREATE POLICY "Allow admin update for settings" ON settings FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Allow admin full access to settings" ON settings FOR ALL USING (is_admin(auth.uid()));

-- Policies for `notifications`
CREATE POLICY "Admins can view all notifications." ON notifications FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update all notifications." ON notifications FOR UPDATE USING (is_admin(auth.uid()));

-- Re-enable RLS that was disabled
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
