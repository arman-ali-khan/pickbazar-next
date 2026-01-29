-- This script provides the definitive structure for the 'orders' table.

-- Drop the old table to ensure a clean slate.
DROP TABLE IF EXISTS public.orders CASCADE;

-- Create the table with the correct columns and data types.
CREATE TABLE public.orders (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    total_amount numeric NOT NULL,
    status public.order_status DEFAULT 'Pending'::public.order_status NOT NULL,
    shipping_details jsonb,
    order_number text NOT NULL,
    coupon_code text,
    discount_amount numeric,
    payment_method text,
    payment_details jsonb
);

-- Set ownership
ALTER TABLE public.orders OWNER TO postgres;

-- Define Primary Key
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);

-- Add Unique Constraint for order_number
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);

-- Add Foreign Key to auth.users
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
