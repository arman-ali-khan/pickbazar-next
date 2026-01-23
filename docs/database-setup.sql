-- ### POLICIES ###
-- 1. Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- 2. profiles table
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. addresses table
DROP POLICY IF EXISTS "Users can manage their own addresses." ON public.addresses;
CREATE POLICY "Users can manage their own addresses." ON public.addresses
  FOR ALL USING (auth.uid() = user_id);

-- 4. cards table
DROP POLICY IF EXISTS "Users can manage their own cards." ON public.cards;
CREATE POLICY "Users can manage their own cards." ON public.cards
  FOR ALL USING (auth.uid() = user_id);

-- 5. Public read-only for products, categories, tags
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
CREATE POLICY "Allow public read access to products" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
CREATE POLICY "Allow public read access to categories" ON public.categories
  FOR SELECT USING (true);
  
DROP POLICY IF EXISTS "Allow public read access to tags" ON public.tags;
CREATE POLICY "Allow public read access to tags" ON public.tags
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to product_categories" ON public.product_categories;
CREATE POLICY "Allow public read access to product_categories" ON public.product_categories
  FOR SELECT USING (true);
  
DROP POLICY IF EXISTS "Allow public read access to product_tags" ON public.product_tags;
CREATE POLICY "Allow public read access to product_tags" ON public.product_tags
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to offers" ON public.offers;
CREATE POLICY "Allow public read access to offers" ON public.offers
  FOR SELECT USING (true);


-- 6. orders and order_items
DROP POLICY IF EXISTS "Users can manage their own orders." ON public.orders;
CREATE POLICY "Users can manage their own orders." ON public.orders
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view items in their own orders." ON public.order_items;
CREATE POLICY "Users can view items in their own orders." ON public.order_items
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM public.orders WHERE id = order_id
    )
  );

DROP POLICY IF EXISTS "Allow authenticated users to create orders." ON public.orders;
CREATE POLICY "Allow authenticated users to create orders." ON public.orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
DROP POLICY IF EXISTS "Allow authenticated users to create order items." ON public.order_items;
CREATE POLICY "Allow authenticated users to create order items." ON public.order_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. reviews and questions
DROP POLICY IF EXISTS "Allow public read for reviews" ON public.reviews;
CREATE POLICY "Allow public read for reviews" ON public.reviews
  FOR SELECT USING (status = 'Approved');

DROP POLICY IF EXISTS "Users can submit reviews and questions." ON public.reviews;
CREATE POLICY "Users can submit reviews and questions." ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public read for questions" ON public.questions;
CREATE POLICY "Allow public read for questions" ON public.questions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can submit questions." ON public.questions;
CREATE POLICY "Users can submit questions." ON public.questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. refunds
DROP POLICY IF EXISTS "Users can manage their own refund requests." ON public.refunds;
CREATE POLICY "Users can manage their own refund requests." ON public.refunds
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (status = 'Pending'); -- Users can only cancel if it's pending


-- Helper function for admin checks
DROP FUNCTION IF EXISTS is_admin(user_id uuid);
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Use SECURITY DEFINER and a specific query to safely access the role from the profiles table.
  SELECT role::text INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role IN ('admin', 'manager', 'super-admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Admin policies
DROP POLICY IF EXISTS "Admins have full access to products." ON public.products;
CREATE POLICY "Admins have full access to products." ON public.products
  FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins have full access to categories." ON public.categories;
CREATE POLICY "Admins have full access to categories." ON public.categories
  FOR ALL USING (is_admin(auth.uid()));
  
DROP POLICY IF EXISTS "Admins have full access to tags." ON public.tags;
CREATE POLICY "Admins have full access to tags." ON public.tags
  FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins have full access to orders." ON public.orders;
CREATE POLICY "Admins have full access to orders." ON public.orders
  FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins have full access to order_items." ON public.order_items;
CREATE POLICY "Admins have full access to order_items." ON public.order_items
  FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins have full access to reviews." ON public.reviews;
CREATE POLICY "Admins have full access to reviews." ON public.reviews
  FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins have full access to questions." ON public.questions;
CREATE POLICY "Admins have full access to questions." ON public.questions
  FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins have full access to refunds." ON public.refunds;
CREATE POLICY "Admins have full access to refunds." ON public.refunds
  FOR ALL USING (is_admin(auth.uid()));
  
DROP POLICY IF EXISTS "Admins have full access to offers." ON public.offers;
CREATE POLICY "Admins have full access to offers." ON public.offers
  FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all user profiles." ON public.profiles;
CREATE POLICY "Admins can view all user profiles." ON public.profiles
  FOR SELECT USING (is_admin(auth.uid()));
  
-- ### VIEWS AND FUNCTIONS ###

-- 1. Handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'customer');
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Get related products
CREATE OR REPLACE FUNCTION get_related_products(p_id int, p_limit int)
RETURNS TABLE (
  id int,
  name text,
  price numeric,
  original_price numeric,
  featured_image_url text,
  unit text
) AS $$
BEGIN
  RETURN QUERY
  WITH ProductCategories AS (
      SELECT category_id
      FROM product_categories
      WHERE product_id = p_id
  )
  SELECT
      p.id,
      p.name,
      p.price,
      p.original_price,
      p.featured_image_url,
      p.unit
  FROM products p
  JOIN product_categories pc ON p.id = pc.product_id
  WHERE pc.category_id IN (SELECT category_id FROM ProductCategories)
    AND p.id != p_id
  GROUP BY p.id
  ORDER BY MAX(p.view_count) DESC, p.id
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 4. Get product reviews
CREATE OR REPLACE FUNCTION get_product_reviews(p_product_id INT)
RETURNS TABLE (
    id BIGINT,
    rating INT,
    text TEXT,
    created_at TIMESTAMPTZ,
    author_name TEXT,
    author_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.rating,
        r.text,
        r.created_at,
        p.full_name AS author_name,
        p.avatar_url AS author_avatar
    FROM
        public.reviews r
    JOIN
        public.profiles p ON r.user_id = p.id
    WHERE
        r.product_id = p_product_id
        AND r.status = 'Approved'
    ORDER BY
        r.created_at DESC;
END;
$$ LANGUAGE plpgsql;


-- 5. Get product rating stats
CREATE OR REPLACE FUNCTION get_product_rating_stats(p_product_id int)
RETURNS TABLE (
    avg_rating numeric,
    total_reviews bigint,
    rating_distribution jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        AVG(r.rating)::numeric(3, 2) as avg_rating,
        COUNT(r.id) as total_reviews,
        (
            SELECT jsonb_agg(ratings)
            FROM (
                SELECT
                    rating,
                    COUNT(id) as count
                FROM public.reviews
                WHERE product_id = p_product_id AND status = 'Approved'
                GROUP BY rating
                ORDER BY rating
            ) as ratings
        ) as rating_distribution
    FROM public.reviews r
    WHERE r.product_id = p_product_id AND r.status = 'Approved';
END;
$$ LANGUAGE plpgsql;

-- 6. Get product questions
CREATE OR REPLACE FUNCTION get_product_questions(p_product_id int)
RETURNS TABLE (
    id bigint,
    question_text text,
    answer_text text,
    created_at timestamptz,
    author_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
      q.id,
      q.question_text,
      q.answer_text,
      q.created_at,
      p.full_name AS author_name
  FROM questions q
  JOIN profiles p ON q.user_id = p.id
  WHERE q.product_id = p_product_id AND q.status = 'Answered'
  ORDER BY q.answered_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. Get all admin users
DROP FUNCTION IF EXISTS get_admins();
CREATE OR REPLACE FUNCTION get_admins()
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    role user_role,
    avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
      p.id,
      p.full_name,
      u.email,
      p.role,
      p.avatar_url
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.role IN ('admin', 'manager', 'super-admin');
END;
$$ LANGUAGE plpgsql;

-- 8. Get potential admins (customers)
DROP FUNCTION IF EXISTS get_potential_admins();
CREATE OR REPLACE FUNCTION get_potential_admins()
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
      p.id,
      p.full_name,
      u.email,
      p.avatar_url
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.role = 'customer'
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Securely get the role of the currently authenticated user
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TABLE (
    role user_role
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.role FROM public.profiles p WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_all_users function
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    created_at timestamptz,
    role user_role
) AS $$
BEGIN
  RETURN QUERY
  SELECT
      p.id,
      p.full_name,
      u.email,
      p.avatar_url,
      u.created_at,
      p.role
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- get_user_details function
CREATE OR REPLACE FUNCTION get_user_details(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    created_at timestamptz,
    role user_role
) AS $$
BEGIN
  RETURN QUERY
  SELECT
      p.id,
      p.full_name,
      u.email,
      p.avatar_url,
      u.created_at,
      p.role
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Get admin order details
CREATE OR REPLACE FUNCTION get_admin_order_details(p_order_number TEXT)
RETURNS TABLE (
    id BIGINT,
    order_number TEXT,
    created_at TIMESTAMPTZ,
    total_amount NUMERIC,
    status order_status,
    shipping_details JSONB,
    order_items JSONB,
    profiles JSONB,
    coupon_code TEXT,
    discount_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    (SELECT jsonb_agg(jsonb_build_object(
      'id', oi.id,
      'quantity', oi.quantity,
      'price_at_purchase', oi.price,
      'products', (SELECT jsonb_build_object(
        'name', p.name,
        'featured_image_url', p.featured_image_url
      ) FROM public.products p WHERE p.id = oi.product_id)
    )) FROM public.order_items oi WHERE oi.order_id = o.id),
    (SELECT jsonb_build_object(
      'full_name', pr.full_name,
      'avatar_url', pr.avatar_url
    ) FROM public.profiles pr WHERE pr.id = o.user_id),
    o.coupon_code,
    o.discount_amount
  FROM public.orders o
  WHERE o.order_number = p_order_number
  LIMIT 1;
END;
$$;


-- Get admin orders
CREATE OR REPLACE FUNCTION get_admin_orders()
RETURNS TABLE (
    id BIGINT,
    user_id UUID,
    order_number TEXT,
    created_at TIMESTAMPTZ,
    total_amount NUMERIC,
    status order_status,
    shipping_details JSONB,
    customer_avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.user_id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        o.shipping_details,
        p.avatar_url as customer_avatar_url
    FROM public.orders o
    LEFT JOIN public.profiles p ON o.user_id = p.id
    ORDER BY o.created_at DESC;
END;
$$;

-- Get Admin Reviews
CREATE OR REPLACE FUNCTION get_admin_reviews()
RETURNS TABLE (
    id BIGINT,
    rating INT,
    text TEXT,
    status review_status,
    created_at TIMESTAMPTZ,
    author JSONB,
    product JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.rating,
        r.text,
        r.status,
        r.created_at,
        jsonb_build_object(
            'name', p.full_name,
            'avatar_url', p.avatar_url
        ) as author,
        jsonb_build_object(
            'id', prod.id,
            'name', prod.name,
            'featured_image_url', prod.featured_image_url
        ) as product
    FROM public.reviews r
    JOIN public.profiles p ON r.user_id = p.id
    JOIN public.products prod ON r.product_id = prod.id
    ORDER BY r.created_at DESC;
END;
$$;

-- Get admin refunds
CREATE OR REPLACE FUNCTION get_admin_refunds()
RETURNS TABLE (
    id BIGINT,
    order_id BIGINT,
    order_number TEXT,
    amount NUMERIC,
    status refund_status,
    reason TEXT,
    created_at TIMESTAMPTZ,
    user_id UUID,
    customer_name TEXT,
    customer_avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        rf.id,
        rf.order_id,
        o.order_number,
        rf.amount,
        rf.status,
        rf.reason,
        rf.created_at,
        rf.user_id,
        p.full_name,
        p.avatar_url
    FROM public.refunds rf
    JOIN public.orders o ON rf.order_id = o.id
    JOIN public.profiles p ON rf.user_id = p.id
    ORDER BY rf.created_at DESC;
END;
$$;

-- Get admin questions
CREATE OR REPLACE FUNCTION get_admin_questions()
RETURNS TABLE (
    id BIGINT,
    question TEXT,
    answer TEXT,
    status question_status,
    date TIMESTAMPTZ,
    author JSONB,
    product JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
        q.id,
        q.question_text as question,
        q.answer_text as answer,
        q.status,
        q.created_at as date,
        jsonb_build_object(
            'name', p.full_name,
            'avatar', jsonb_build_object(
                'imageUrl', p.avatar_url,
                'imageHint', 'person face'
            )
        ) as author,
        jsonb_build_object(
            'id', prod.id,
            'name', prod.name,
            'image', jsonb_build_object(
                'imageUrl', prod.featured_image_url,
                'imageHint', 'product'
            )
        ) as product
    FROM public.questions q
    JOIN public.profiles p ON q.user_id = p.id
    JOIN public.products prod ON q.product_id = prod.id
    ORDER BY q.created_at DESC;
END;
$$;

-- get_admin_question_details
CREATE OR REPLACE FUNCTION get_admin_question_details(p_question_id BIGINT)
RETURNS TABLE (
    id BIGINT,
    question TEXT,
    answer TEXT,
    status question_status,
    date TIMESTAMPTZ,
    author JSONB,
    product JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
        q.id,
        q.question_text as question,
        q.answer_text as answer,
        q.status,
        q.created_at as date,
        jsonb_build_object(
            'name', p.full_name,
            'avatar', jsonb_build_object(
                'imageUrl', p.avatar_url,
                'imageHint', 'person face'
            )
        ) as author,
        jsonb_build_object(
            'id', prod.id,
            'name', prod.name,
            'image', jsonb_build_object(
                'imageUrl', prod.featured_image_url,
                'imageHint', 'product'
            )
        ) as product
    FROM public.questions q
    JOIN public.profiles p ON q.user_id = p.id
    JOIN public.products prod ON q.product_id = prod.id
    WHERE q.id = p_question_id;
END;
$$;

-- get_user_reviews
CREATE OR REPLACE FUNCTION get_user_reviews(p_user_id UUID)
RETURNS TABLE (
    id BIGINT,
    rating INT,
    text TEXT,
    status review_status,
    created_at TIMESTAMPTZ,
    product_name TEXT,
    product_image TEXT,
    product_id BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
        r.id,
        r.rating,
        r.text,
        r.status,
        r.created_at,
        p.name,
        p.featured_image_url,
        p.id
    FROM public.reviews r
    JOIN public.products p ON r.product_id = p.id
    WHERE r.user_id = p_user_id
    ORDER BY r.created_at DESC;
END;
$$;

-- get_user_questions
CREATE OR REPLACE FUNCTION get_user_questions(p_user_id UUID)
RETURNS TABLE (
    id BIGINT,
    question_text TEXT,
    answer_text TEXT,
    status question_status,
    created_at TIMESTAMPTZ,
    product_name TEXT,
    product_id BIGINT,
    product_image TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
        q.id,
        q.question_text,
        q.answer_text,
        q.status,
        q.created_at,
        p.name,
        p.id,
        p.featured_image_url
    FROM public.questions q
    JOIN public.products p ON q.product_id = p.id
    WHERE q.user_id = p_user_id
    ORDER BY q.created_at DESC;
END;
$$;


-- get_user_refunds
CREATE OR REPLACE FUNCTION get_user_refunds(p_user_id UUID)
RETURNS TABLE (
    id BIGINT,
    order_id BIGINT,
    order_number TEXT,
    amount NUMERIC,
    status refund_status,
    reason TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
        r.id,
        r.order_id,
        o.order_number,
        r.amount,
        r.status,
        r.reason,
        r.created_at
    FROM public.refunds r
    JOIN public.orders o ON r.order_id = o.id
    WHERE r.user_id = p_user_id
    ORDER BY r.created_at DESC;
END;
$$;


-- get_user_transactions
CREATE OR REPLACE FUNCTION get_user_transactions(p_user_id UUID)
RETURNS TABLE (
    id BIGINT,
    order_id BIGINT,
    order_number TEXT,
    amount NUMERIC,
    payment_method TEXT,
    status transaction_status,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
        t.id,
        t.order_id,
        o.order_number,
        t.amount,
        t.payment_method,
        t.status,
        t.created_at
    FROM public.transactions t
    JOIN public.orders o ON t.order_id = o.id
    WHERE o.user_id = p_user_id
    ORDER BY t.created_at DESC;
END;
$$;


-- get_admin_transactions
CREATE OR REPLACE FUNCTION get_admin_transactions()
RETURNS TABLE (
    id BIGINT,
    order_id BIGINT,
    order_number TEXT,
    customer_name TEXT,
    customer_avatar TEXT,
    amount NUMERIC,
    payment_method TEXT,
    status transaction_status,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
        t.id,
        t.order_id,
        o.order_number,
        COALESCE(p.full_name, (o.shipping_details->>'firstName') || ' ' || (o.shipping_details->>'lastName')),
        p.avatar_url,
        t.amount,
        t.payment_method,
        t.status,
        t.created_at
    FROM public.transactions t
    JOIN public.orders o ON t.order_id = o.id
    LEFT JOIN public.profiles p ON o.user_id = p.id
    ORDER BY t.created_at DESC;
END;
$$;

-- RLS policy for settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to admins" ON public.settings;
CREATE POLICY "Allow full access to admins" ON public.settings
  FOR ALL USING (is_admin(auth.uid()));
  
-- Get all settings function
CREATE OR REPLACE FUNCTION get_all_settings()
RETURNS jsonb AS $$
DECLARE
    settings_json jsonb;
BEGIN
    SELECT jsonb_object_agg(key, value)
    INTO settings_json
    FROM public.settings;
    RETURN settings_json;
END;
$$ LANGUAGE plpgsql;

-- update_home_sections
CREATE OR REPLACE FUNCTION update_home_sections(sections_data jsonb)
RETURNS void AS $$
BEGIN
    -- Ensure the user is an admin
    IF NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can modify home page sections';
    END IF;

    -- Delete existing sections
    DELETE FROM public.home_page_sections;

    -- Insert new sections from the provided JSON data
    INSERT INTO public.home_page_sections (category_id, display_order)
    SELECT
        (value->>'category_id')::INT,
        (value->>'display_order')::INT
    FROM jsonb_array_elements(sections_data);
END;
$$ LANGUAGE plpgsql;
