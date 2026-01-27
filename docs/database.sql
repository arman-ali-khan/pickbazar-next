-- This is a reference for the database schema. It is not an executable file.
-- The actual schema is managed by Supabase migrations.

-- Main table for storing customer orders
CREATE TABLE public.orders (
    id bigint NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    order_number text NOT NULL UNIQUE,
    total_amount numeric NOT NULL,
    status text NOT NULL DEFAULT 'Pending',
    shipping_details jsonb,
    payment_method text,
    payment_details jsonb, -- To store response from payment gateway
    coupon_code text,
    discount_amount numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table for storing items within an order
CREATE TABLE public.order_items (
    id bigint NOT NULL PRIMARY KEY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id bigint REFERENCES public.products(id),
    quantity integer NOT NULL,
    price_at_purchase numeric NOT NULL
);

-- Table for storing payment transactions
CREATE TABLE public.transactions (
    id bigint NOT NULL PRIMARY KEY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    amount numeric NOT NULL,
    payment_method text NOT NULL,
    status text NOT NULL, -- e.g., 'Pending', 'Completed', 'Failed'
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Key-value store for site-wide settings, including payment gateway credentials
CREATE TABLE public.settings (
    key text NOT NULL PRIMARY KEY,
    value text
);

-- Example aamarPay settings stored in the 'settings' table
-- Note: These are upserted from the admin panel, not with direct INSERT statements.
-- INSERT INTO public.settings (key, value)
-- VALUES
--   ('enable_aamarpay', 'true'),
--   ('aamarpay_mode', 'sandbox'),
--   ('aamarpay_sandbox_store_id', 'aamarpaytest'),
--   ('aamarpay_sandbox_signature_key', 'dbb74894e82415a2f7ff0ec3a97e4183'),
--   ('aamarpay_production_store_id', 'YOUR_LIVE_STORE_ID'),
--   ('aamarpay_production_signature_key', 'YOUR_LIVE_SIGNATURE_KEY');
