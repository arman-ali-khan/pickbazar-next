-- This script fixes order-related database functions.
-- Please run this entire script in your Supabase SQL Editor to resolve the errors.

-- Step 1: Remove the obsolete 'transactions' table and its related type.
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TYPE IF EXISTS public.transaction_status;


-- Step 2: Correct the 'create_order' function to save payment details directly to the 'orders' table.
CREATE OR REPLACE FUNCTION public.create_order(
    p_total_amount numeric,
    p_shipping_details jsonb,
    p_items jsonb,
    p_payment_method text,
    p_transaction_details jsonb,
    p_coupon_code text DEFAULT NULL::text,
    p_discount_amount numeric DEFAULT 0,
    p_initial_status public.order_status DEFAULT 'Pending'::public.order_status
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item jsonb;
    auth_user_id uuid := auth.uid();
BEGIN
    -- Insert into orders table, now including payment_details
    INSERT INTO public.orders (user_id, total_amount, status, shipping_details, coupon_code, discount_amount, payment_method, payment_details)
    VALUES (auth_user_id, p_total_amount, p_initial_status, p_shipping_details, p_coupon_code, p_discount_amount, p_payment_method, p_transaction_details)
    RETURNING id, order_number INTO new_order_id, new_order_number;

    -- Insert into order_items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, (item->>'product_id')::bigint, (item->>'quantity')::int, (item->>'price')::numeric);
    END LOOP;

    -- Log initial status
    INSERT INTO public.order_history (order_id, status) VALUES (new_order_id, p_initial_status);
    
    RETURN new_order_number;
END;
$$;


-- Step 3: Correct 'get_admin_order_details' to read payment info from the 'orders' table.
CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text)
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount numeric,
    status public.order_status,
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
        o.created_at,
        o.total_amount,
        o.status,
        o.shipping_details,
        jsonb_build_object(
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ) AS profiles,
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
        )
        FROM public.order_items oi
        JOIN public.products pr ON oi.product_id = pr.id
        WHERE oi.order_id = o.id
        ) AS order_items,
        o.coupon_code,
        o.discount_amount,
        o.payment_method,
        o.payment_details AS transaction_details
    FROM
        public.orders o
    LEFT JOIN
        public.profiles p ON o.user_id = p.id
    WHERE
        o.order_number = p_order_number;
END;
$$;

-- Step 4: Correct 'get_user_transactions' to generate transaction history from the 'orders' table.
CREATE OR REPLACE FUNCTION public.get_user_transactions(p_user_id uuid)
RETURNS TABLE(
    id bigint,
    order_id bigint,
    order_number text,
    amount numeric,
    payment_method text,
    status text,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id, -- Use order id as transaction id for simplicity
        o.id as order_id,
        o.order_number,
        o.total_amount as amount,
        o.payment_method,
        CASE 
            WHEN o.status = 'Cancelled' THEN 'Failed'
            WHEN o.status = 'Pending' THEN 'Pending'
            ELSE 'Completed'
        END::text as status,
        o.created_at
    FROM public.orders o
    WHERE o.user_id = p_user_id
    AND o.payment_method IS NOT NULL
    ORDER BY o.created_at DESC;
END;
$$;

