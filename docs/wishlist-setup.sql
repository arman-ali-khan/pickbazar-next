-- Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id int NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT wishlist_user_product_unique UNIQUE (user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Policies for wishlist
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist;
CREATE POLICY "Users can view their own wishlist"
ON public.wishlist FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own wishlist items" ON public.wishlist;
CREATE POLICY "Users can insert their own wishlist items"
ON public.wishlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own wishlist items" ON public.wishlist;
CREATE POLICY "Users can delete their own wishlist items"
ON public.wishlist FOR DELETE
USING (auth.uid() = user_id);


-- Function to toggle wishlist item
CREATE OR REPLACE FUNCTION toggle_wishlist_item(p_user_id uuid, p_product_id int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_exists boolean;
  result_status text;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.wishlist WHERE user_id = p_user_id AND product_id = p_product_id) INTO item_exists;

  IF item_exists THEN
    DELETE FROM public.wishlist WHERE user_id = p_user_id AND product_id = p_product_id;
    result_status := 'removed';
  ELSE
    INSERT INTO public.wishlist (user_id, product_id) VALUES (p_user_id, p_product_id);
    result_status := 'added';
  END IF;

  RETURN json_build_object('status', result_status);
END;
$$;

-- Function to get user's wishlist IDs
CREATE OR REPLACE FUNCTION get_user_wishlist_ids(p_user_id uuid)
RETURNS TABLE (product_id int)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT w.product_id FROM public.wishlist w WHERE w.user_id = p_user_id;
END;
$$;


-- Function to get user's wishlist products for profile page
DROP FUNCTION IF EXISTS get_user_wishlist_products(uuid);
CREATE OR REPLACE FUNCTION get_user_wishlist_products(p_user_id uuid)
RETURNS TABLE(
    id int,
    name text,
    price numeric,
    original_price numeric,
    featured_image_url text,
    unit text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.price,
        p.original_price,
        p.featured_image_url,
        p.unit
    FROM
        public.products p
    JOIN
        public.wishlist w ON p.id = w.product_id
    WHERE
        w.user_id = p_user_id
    ORDER BY w.created_at DESC;
END;
$$;

-- Function for admin to view a user's wishlist
DROP FUNCTION IF EXISTS get_admin_user_wishlist(uuid);
CREATE OR REPLACE FUNCTION get_admin_user_wishlist(p_user_id uuid)
RETURNS TABLE(
    id int,
    name text,
    featured_image_url text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.featured_image_url
    FROM
        public.products p
    JOIN
        public.wishlist w ON p.id = w.product_id
    WHERE
        w.user_id = p_user_id
    ORDER BY w.created_at DESC;
END;
$$;
