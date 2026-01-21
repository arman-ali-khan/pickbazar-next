-- This schema is designed for PostgreSQL and is compatible with Supabase.
-- It assumes you are using Supabase Auth, where user details are stored in the `auth.users` table.
-- We will link our public tables to the `auth.users` table using the user's UUID.

-- =============================================
-- Users Table (Public Profile Extension)
-- =============================================
-- This table stores public profile information that extends the built-in Supabase auth.users table.
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    bio TEXT,
    avatar_url TEXT, -- URL from Cloudinary
    phone_number TEXT UNIQUE
);

-- =============================================
-- Products Table
-- =============================================
-- Central table for all products available in the store.
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    stock INTEGER DEFAULT 0,
    category TEXT,
    image_url TEXT, -- Main product image URL
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Addresses Table
-- =============================================
-- Stores multiple shipping or billing addresses for each user.
CREATE TYPE address_type AS ENUM ('shipping', 'billing');

CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type address_type NOT NULL,
    title TEXT,
    country TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    street_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Cards Table (Payment Methods)
-- =============================================
-- WARNING: Do NOT store raw credit card numbers. Store only non-sensitive information
-- like the last 4 digits and card type, which you get from a payment provider (e.g., Stripe).
CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_type TEXT, -- e.g., 'Visa', 'Mastercard'
    last4 TEXT NOT NULL,
    expiry_month INT NOT NULL,
    expiry_year INT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Orders and Order Items Tables
-- =============================================
CREATE TYPE order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled');

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_date TIMESTAMPTZ DEFAULT NOW(),
    status order_status DEFAULT 'Pending',
    total_amount NUMERIC(10, 2) NOT NULL,
    shipping_address_id INTEGER REFERENCES addresses(id)
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase NUMERIC(10, 2) NOT NULL
);

-- =============================================
-- Wishlist Table
-- =============================================
-- Stores items a user has added to their wishlist.
CREATE TABLE wishlist_items (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

-- =============================================
-- Questions Table
-- =============================================
-- Stores questions asked by users about products.
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    answer_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_answered BOOLEAN DEFAULT FALSE
);

-- =============================================
-- Reviews Table
-- =============================================
CREATE TYPE review_status AS ENUM ('Pending', 'Approved', 'Hidden');

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    status review_status DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Refunds Table
-- =============================================
CREATE TYPE refund_status AS ENUM ('Pending', 'Approved', 'Rejected');

CREATE TABLE refunds (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status refund_status DEFAULT 'Pending',
    amount NUMERIC(10, 2) NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- =============================================
-- Notifications Table
-- =============================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT, -- Optional link for the notification
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Search History Table
-- =============================================
CREATE TABLE search_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    search_time TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Product Views Table
-- =============================================
CREATE TABLE product_views (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Can be anonymous
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    view_time TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Cart Items Table
-- =============================================
-- This table can be used for persisting cart items on the server side.
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);
