-- This script is designed to be idempotent, meaning it can be run multiple times safely.
-- It will only create objects that do not already exist.

-- Drop old, ambiguous functions if they exist with incorrect signatures
DROP FUNCTION IF EXISTS public.create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric
);

DROP FUNCTION IF EXISTS public.create_order(
    p_total_amount numeric, 
    p_shipping_details jsonb, 
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text,
    p_discount_amount numeric,
    p_initial_status text
);


-- =================================================================
-- 1. EXTENSIONS
-- =================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =================================================================
-- 2. ENUM TYPES
-- =================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Failed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('customer', 'manager', 'admin', 'super-admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE public.notification_type AS ENUM (
            'new_order', 'order_update', 'new_review', 'review_approved', 'new_question', 'question_answered', 
            'new_refund', 'refund_update', 'new_message', 'role_update', 'promotion', 'security'
        );
    END IF;
END
$$;

-- =================================================================
-- 3. TABLES & SEQUENCES
-- =================================================================

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    updated_at timestamp with time zone,
    full_name text,
    avatar_url text,
    role public.user_role DEFAULT 'customer'::public.user_role,
    bio text,
    contact_number text
);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id bigint NOT NULL,
    user_id uuid,
    order_number text DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status public.order_status DEFAULT 'Pending'::public.order_status NOT NULL,
    shipping_details jsonb,
    payment_details jsonb,
    coupon_code text,
    discount_amount numeric(10,2) DEFAULT 0
);
CREATE SEQUENCE IF NOT EXISTS public.orders_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;
ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


-- Order History Table (<<< THIS WAS THE MISSING TABLE)
CREATE TABLE IF NOT EXISTS public.order_history (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    status public.order_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS public.order_history_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.order_history_id_seq OWNED BY public.order_history.id;
ALTER TABLE ONLY public.order_history ALTER COLUMN id SET DEFAULT nextval('public.order_history_id_seq'::regclass);
ALTER TABLE ONLY public.order_history ADD CONSTRAINT order_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_history ADD CONSTRAINT order_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    product_id bigint NOT NULL,
    quantity integer NOT NULL,
    price_at_purchase numeric(10,2) NOT NULL
);
CREATE SEQUENCE IF NOT EXISTS public.order_items_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;
ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
-- Note: product_id foreign key is omitted to allow products to be deleted without breaking old orders.

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id bigint NOT NULL,
    order_id bigint,
    amount numeric(10,2),
    payment_method text,
    status text,
    transaction_details jsonb,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS public.transactions_id_seq AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;
ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);
ALTER TABLE ONLY public.transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.transactions ADD CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


-- Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL,
    value text
);
ALTER TABLE ONLY public.settings ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


-- =================================================================
-- 4. DATABASE FUNCTIONS (RPC)
-- =================================================================

-- Function to create an order
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
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item jsonb;
    current_user_id uuid := auth.uid();
BEGIN
    -- Insert the new order and get its ID and order_number
    INSERT INTO public.orders (user_id, total_amount, shipping_details, status, coupon_code, discount_amount)
    VALUES (current_user_id, p_total_amount, p_shipping_details, p_initial_status, p_coupon_code, p_discount_amount)
    RETURNING id, order_number INTO new_order_id, new_order_number;

    -- Log the initial status in the history table
    INSERT INTO public.order_history (order_id, status)
    VALUES (new_order_id, p_initial_status);

    -- Loop through the items and insert them into order_items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, (item->>'product_id')::bigint, (item->>'quantity')::integer, (item->>'price')::numeric);
    END LOOP;

    -- Insert into transactions
    INSERT INTO public.transactions (order_id, amount, payment_method, status, transaction_details)
    VALUES (new_order_id, p_total_amount, p_payment_method, 'Completed', p_transaction_details);

    -- Return the generated order number
    RETURN new_order_number;
END;
$function$;

-- Function to update order status and log it
CREATE OR REPLACE FUNCTION public.update_order_status_and_log(p_order_id bigint, p_new_status text)
 RETURNS TABLE(order_number text, user_id uuid)
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Update the order status
    UPDATE public.orders
    SET status = p_new_status::public.order_status
    WHERE id = p_order_id;

    -- Log the status change in the order_history table
    INSERT INTO public.order_history (order_id, status)
    VALUES (p_order_id, p_new_status::public.order_status);
    
    -- Return the updated order number and user_id for notification purposes
    RETURN QUERY 
    SELECT o.order_number, o.user_id 
    FROM public.orders o 
    WHERE o.id = p_order_id;
END;
$function$;


-- Function to get order history
CREATE OR REPLACE FUNCTION public.get_order_history(p_order_id bigint)
 RETURNS TABLE(status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT oh.status::text, oh.created_at
    FROM public.order_history oh
    WHERE oh.order_id = p_order_id
    ORDER BY oh.created_at ASC;
END;
$function$;


-- Function to get all settings as a single JSON object
CREATE OR REPLACE FUNCTION public.get_all_settings()
RETURNS json
LANGUAGE sql
AS $$
  SELECT json_object_agg(key, value)
  FROM public.settings;
$$;
