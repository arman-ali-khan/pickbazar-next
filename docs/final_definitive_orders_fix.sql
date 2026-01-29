-- Step 1: Add the missing foreign key constraint to the 'orders' table.
-- This explicitly tells the database about the relationship between orders and users,
-- which resolves the "could not find a relationship" error in Supabase's API layer.
-- We wrap this in a DO block to avoid errors if the constraint already exists.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'orders_user_id_fkey'
    ) THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT orders_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES auth.users (id)
        ON DELETE SET NULL;
    END IF;
END $$;


-- Step 2: Re-create the database function to fetch the order list for the admin page.
-- This version includes `SECURITY DEFINER`, allowing it to securely access user emails,
-- and ensures the output structure is correct.
CREATE OR REPLACE FUNCTION get_admin_order_list()
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status public.order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        COALESCE(p.full_name, o.shipping_details->>'firstName' || ' ' || o.shipping_details->>'lastName') AS customer_name,
        COALESCE(au.email, o.shipping_details->>'email') AS customer_email,
        p.avatar_url AS customer_avatar_url
    FROM
        orders AS o
    LEFT JOIN
        profiles AS p ON o.user_id = p.id
    LEFT JOIN
        auth.users AS au ON o.user_id = au.id
    ORDER BY
        o.created_at DESC;
END;
$$;


-- Step 3: Re-create the function to get the details for a single order.
-- This version also includes `SECURITY DEFINER` and corrects the data structure.
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number text)
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status public.order_status,
    shipping_details jsonb,
    coupon_code text,
    discount_amount numeric,
    payment_method text,
    transaction_details jsonb,
    order_items jsonb,
    profiles jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        jsonb_agg(
            jsonb_build_object(
                'id', oi.id,
                'quantity', oi.quantity,
                'price_at_purchase', oi.price,
                'products', jsonb_build_object(
                    'name', p.name,
                    'featured_image_url', p.featured_image_url
                )
            )
        ) AS order_items,
        jsonb_build_object(
            'full_name', prof.full_name,
            'avatar_url', prof.avatar_url
        ) AS profiles
    FROM
        public.orders AS o
    LEFT JOIN
        public.order_items AS oi ON o.id = oi.order_id
    LEFT JOIN
        public.products AS p ON oi.product_id = p.id
    LEFT JOIN
        public.profiles AS prof ON o.user_id = prof.id
    WHERE
        o.order_number = p_order_number
    GROUP BY
        o.id, prof.id;
END;
$$;
