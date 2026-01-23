-- Create the wishlist table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wishlist (
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT wishlist_pkey PRIMARY KEY (user_id, product_id),
    CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent errors on re-run
DROP POLICY IF EXISTS "Allow individual access to own wishlist" ON public.wishlist;

-- Create policy for users to manage their own wishlist
CREATE POLICY "Allow individual access to own wishlist"
    ON public.wishlist
    FOR ALL
    USING (auth.uid() = user_id);

-- Function to toggle an item in the wishlist
CREATE OR REPLACE FUNCTION toggle_wishlist_item(p_user_id uuid, p_product_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_wishlisted boolean;
    result jsonb;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.wishlist WHERE user_id = p_user_id AND product_id = p_product_id) INTO is_wishlisted;

    IF is_wishlisted THEN
        DELETE FROM public.wishlist WHERE user_id = p_user_id AND product_id = p_product_id;
        result := jsonb_build_object('status', 'removed');
    ELSE
        INSERT INTO public.wishlist (user_id, product_id) VALUES (p_user_id, p_product_id);
        result := jsonb_build_object('status', 'added');
    END IF;

    RETURN result;
END;
$$;

-- Function to get a user's wishlist product IDs
CREATE OR REPLACE FUNCTION get_user_wishlist_ids(p_user_id uuid)
RETURNS TABLE (product_id bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT product_id FROM public.wishlist WHERE user_id = p_user_id;
$$;

-- Function to get a user's full wishlist products
CREATE OR REPLACE FUNCTION get_user_wishlist_products(p_user_id uuid)
RETURNS TABLE (
    id bigint,
    name text,
    price numeric,
    original_price numeric,
    featured_image_url text,
    unit text,
    status text,
    view_count bigint,
    created_at timestamp with time zone,
    slug text,
    description text,
    stock bigint,
    gallery_urls text[]
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT p.*
    FROM public.products p
    JOIN public.wishlist w ON p.id = w.product_id
    WHERE w.user_id = p_user_id;
$$;


-- Function for admins to get any user's wishlist
CREATE OR REPLACE FUNCTION get_admin_user_wishlist(p_user_id uuid)
RETURNS TABLE (
    id bigint,
    name text,
    featured_image_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role text;
BEGIN
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    
    IF caller_role IN ('admin', 'super-admin', 'manager') THEN
        RETURN QUERY
        SELECT p.id, p.name, p.featured_image_url
        FROM public.products p
        JOIN public.wishlist w ON p.id = w.product_id
        WHERE w.user_id = p_user_id;
    END IF;
END;
$$;
