-- This file contains the definitive and correct schema for all order-related tables.
-- You can use this to verify and correct your database structure.

-- Note: The commented-out DROP statements below would delete all data in these tables.
-- Use them with extreme caution if you need to start from a completely clean slate.
/*
DROP TABLE IF EXISTS public.order_history;
DROP TABLE IF EXISTS public.order_items;
DROP TABLE IF EXISTS public.orders;
DROP TYPE IF EXISTS public.order_status;
*/

-- 1. Create the ENUM type for order status if it doesn't exist
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


-- 2. Create the main 'orders' table
CREATE TABLE IF NOT EXISTS public.orders (
    id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number text NOT NULL UNIQUE,
    total_amount numeric(10, 2) NOT NULL,
    status public.order_status DEFAULT 'Pending'::public.order_status NOT NULL,
    shipping_details jsonb,
    payment_method text,
    payment_details jsonb,
    coupon_code text,
    discount_amount numeric(10, 2) DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Create the 'order_items' table
CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id bigint REFERENCES public.products(id) ON DELETE SET NULL,
    quantity integer NOT NULL,
    price_at_purchase numeric(10, 2) NOT NULL
);

-- 4. Create the 'order_history' table to log status changes
CREATE TABLE IF NOT EXISTS public.order_history (
    id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status public.order_status NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS order_history_order_id_idx ON public.order_history (order_id);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view items of their own orders" ON public.order_items;
CREATE POLICY "Users can view items of their own orders"
ON public.order_items FOR SELECT
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM orders
  WHERE (orders.id = order_items.order_id))));

DROP POLICY IF EXISTS "Users can view history of their own orders" ON public.order_history;
CREATE POLICY "Users can view history of their own orders"
ON public.order_history FOR SELECT
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM orders
  WHERE (orders.id = order_history.order_id))));

-- Admin policies
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders"
ON public.orders FOR ALL
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
CREATE POLICY "Admins can manage all order items"
ON public.order_items FOR ALL
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all order history" ON public.order_history;
CREATE POLICY "Admins can manage all order history"
ON public.order_history FOR ALL
USING (public.is_admin());
