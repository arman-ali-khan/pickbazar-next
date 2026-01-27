-- This file documents the SQL structure for the application.
-- This is for reference and is not an executable migration file.

-- Custom Types
-- Note: You might need to create this type in your Supabase dashboard under Database > Types if it doesn't exist.
-- CREATE TYPE order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Failed');

-- Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    order_number TEXT UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status order_status NOT NULL DEFAULT 'Pending',
    shipping_details JSONB,
    payment_details JSONB,
    coupon_code TEXT,
    discount_amount DECIMAL(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL
);

-- Transactions Table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL, -- 'Pending', 'Completed', 'Failed'
    transaction_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings Table (for payment gateway credentials)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Sample settings for aamarPay
INSERT INTO settings (key, value) VALUES 
('aamarpay_mode', 'sandbox'), -- 'sandbox' or 'production'
('aamarpay_sandbox_store_id', 'aamarpaytest'),
('aamarpay_sandbox_signature_key', 'dbb74894e82415a2f7ff0ec3a97e4183'),
('aamarpay_production_store_id', ''),
('aamarpay_production_signature_key', '');

-- Function to create an order and return its order_number (which is used as tran_id)
-- This function is called via RPC from the application.
CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount decimal,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount decimal,
    p_initial_status order_status DEFAULT 'Pending'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id int;
    new_order_number text;
    item jsonb;
    current_user_id uuid := auth.uid();
BEGIN
    -- 1. Generate a unique order number
    new_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || substr(md5(random()::text), 1, 6);

    -- 2. Insert into orders table
    INSERT INTO orders (
        user_id,
        order_number,
        total_amount,
        shipping_details,
        status,
        coupon_code,
        discount_amount
    )
    VALUES (
        current_user_id,
        new_order_number,
        p_total_amount,
        p_shipping_details,
        p_initial_status,
        p_coupon_code,
        p_discount_amount
    )
    RETURNING id INTO new_order_id;

    -- 3. Insert into order_items table
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            price_at_purchase
        )
        VALUES (
            new_order_id,
            (item->>'product_id')::int,
            (item->>'quantity')::int,
            (item->>'price')::decimal
        );
    END LOOP;

    -- 4. Insert into transactions table
    INSERT INTO transactions (
        order_id,
        user_id,
        amount,
        payment_method,
        status,
        transaction_details
    )
    VALUES (
        new_order_id,
        current_user_id,
        p_total_amount,
        p_payment_method,
        'Pending',
        p_transaction_details
    );

    -- 5. Return the new order number (which is used as tran_id)
    RETURN new_order_number;
END;
$$;
