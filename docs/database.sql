
-- Enable RLS
alter table
  public.profiles enable row level security;

alter table
  public.pages enable row level security;

alter table
  public.settings enable row level security;

alter table
  public.categories enable row level security;

alter table
  public.tags enable row level security;

alter table
  public.products enable row level security;

alter table
  public.product_categories enable row level security;

alter table
  public.product_tags enable row level security;

alter table
  public.orders enable row level security;

alter table
  public.order_items enable row level security;

alter table
  public.transactions enable row level security;

alter table
  public.reviews enable row level security;

alter table
  public.questions enable row level security;

alter table
  public.wishlist enable row level security;

alter table
  public.cards enable row level security;

alter table
  public.addresses enable row level security;

alter table
  public.refunds enable row level security;

alter table
  public.offers enable row level security;

alter table
  public.promos enable row level security;

alter table
  public.contact_messages enable row level security;

alter table
  public.notifications enable row level security;

-- Create Policies
-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR
SELECT
  USING (TRUE);

CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT
WITH
  CHECK (auth.uid () = id);

CREATE POLICY "Users can update their own profile." ON profiles FOR
UPDATE
  USING (auth.uid () = id)
WITH
  CHECK (auth.uid () = id);

-- PAGES
CREATE POLICY "Pages are public." ON pages FOR
SELECT
  USING (TRUE);

-- CATEGORIES
CREATE POLICY "Categories are public." ON categories FOR
SELECT
  USING (TRUE);

-- TAGS
CREATE POLICY "Tags are public." ON tags FOR
SELECT
  USING (TRUE);

-- PRODUCTS
CREATE POLICY "Products are public." ON products FOR
SELECT
  USING (TRUE);

-- PRODUCT_CATEGORIES
CREATE POLICY "Product-categories are public." ON product_categories FOR
SELECT
  USING (TRUE);

-- PRODUCT_TAGS
CREATE POLICY "Product-tags are public." ON product_tags FOR
SELECT
  USING (TRUE);

-- REVIEWS
CREATE POLICY "Reviews are public." ON reviews FOR
SELECT
  USING (TRUE);

CREATE POLICY "Users can manage their own reviews." ON reviews FOR ALL USING (auth.uid () = user_id)
WITH
  CHECK (auth.uid () = user_id);

-- QUESTIONS
CREATE POLICY "Questions are public." ON questions FOR
SELECT
  USING (TRUE);

CREATE POLICY "Users can manage their own questions." ON questions FOR ALL USING (auth.uid () = user_id)
WITH
  CHECK (auth.uid () = user_id);

-- WISHLIST
CREATE POLICY "Users can manage their own wishlist." ON wishlist FOR ALL USING (auth.uid () = user_id)
WITH
  CHECK (auth.uid () = user_id);

-- CARDS
CREATE POLICY "Users can manage their own cards." ON cards FOR ALL USING (auth.uid () = user_id)
WITH
  CHECK (auth.uid () = user_id);

-- ADDRESSES
CREATE POLICY "Users can manage their own addresses." ON addresses FOR ALL USING (auth.uid () = user_id)
WITH
  CHECK (auth.uid () = user_id);

-- ORDERS
CREATE POLICY "Users can view their own orders." ON orders FOR
SELECT
  USING (auth.uid () = user_id);

-- REFUNDS
CREATE POLICY "Users can manage their own refund requests." ON refunds FOR ALL USING (auth.uid () = user_id AND status = 'Pending')
WITH
  CHECK (auth.uid () = user_id);

CREATE POLICY "Admins can manage refund requests." ON refunds FOR ALL USING (
  (
    SELECT
      role
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) IN ('admin', 'manager', 'super-admin')
);

-- NOTIFICATIONS
CREATE POLICY "Users can view their own notifications." ON notifications FOR
SELECT
  USING (auth.uid () = user_id);

CREATE POLICY "Admins can view admin notifications." ON notifications FOR
SELECT
  USING (
    user_id IS NULL
    AND (
      SELECT
        role
      FROM
        profiles
      WHERE
        id = auth.uid ()
    ) IN ('admin', 'manager', 'super-admin')
  );

-- ADMIN-ONLY WRITE ACCESS
CREATE POLICY "Admins have full access to everything." ON pages FOR ALL USING (
  (
    SELECT
      role
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) IN ('admin', 'manager', 'super-admin')
)
WITH
  CHECK (
    (
      SELECT
        role
      FROM
        profiles
      WHERE
        id = auth.uid ()
    ) IN ('admin', 'manager', 'super-admin')
  );

CREATE POLICY "Admins have full access to everything." ON settings FOR ALL USING (
  (
    SELECT
      role
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) IN ('admin', 'manager', 'super-admin')
)
WITH
  CHECK (
    (
      SELECT
        role
      FROM
        profiles
      WHERE
        id = auth.uid ()
    ) IN ('admin', 'manager', 'super-admin')
  );

CREATE POLICY "Admins have full access to everything." ON categories FOR ALL USING (
  (
    SELECT
      role
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) IN ('admin', 'manager', 'super-admin')
)
WITH
  CHECK (
    (
      SELECT
        role
      FROM
        profiles
      WHERE
        id = auth.uid ()
    ) IN ('admin', 'manager', 'super-admin')
  );

CREATE POLICY "Admins have full access to everything." ON tags FOR ALL USING (
  (
    SELECT
      role
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) IN ('admin', 'manager', 'super-admin')
)
WITH
  CHECK (
    (
      SELECT
        role
      FROM
        profiles
      WHERE
        id = auth.uid ()
    ) IN ('admin', 'manager', 'super-admin')
  );

CREATE POLICY "Admins have full access to everything." ON products FOR ALL USING (
  (
    SELECT
      role
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) IN ('admin', 'manager', 'super-admin')
)
WITH
  CHECK (
    (
      SELECT
        role
      FROM
        profiles
      WHERE
        id = auth.uid ()
    ) IN ('admin', 'manager', 'super-admin')
  );

CREATE POLICY "Admins have full access to everything." ON product_categories FOR ALL USING (
  (
    SELECT
      role
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) IN ('admin', 'manager', 'super-admin')
)
WITH
  CHECK (
    (
      SELECT
        role
      FROM
        profiles
      WHERE
        id = auth.uid ()
    ) IN ('admin', 'manager', 'super-admin')
  );

CREATE POLICY "Admins have full access to everything." ON product_tags FOR ALL USING (
  (
    SELECT
      role
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) IN ('admin', 'manager', 'super-admin')
)
WITH
  CHECK (
    (
      SELECT
        role
      FROM
        profiles
      WHERE
        id = auth.uid ()
    ) IN ('admin', 'manager', 'super-admin')
  );

CREATE POLICY "Admins can manage all reviews." ON reviews FOR ALL USING (
  (
    SELECT
      role
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) IN ('admin', 'manager', 'super-admin')
);

CREATE POLICY "Admins can manage all questions." ON questions FOR ALL USING (
  (
    SELECT
      role
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) IN ('admin', 'manager', 'super-admin')
);

CREATE POLICY "Admins can view all wishlists." ON wishlist FOR
SELECT
  USING (
    (
      SELECT
        role
      FROM
        profiles
      WHERE
        id = auth.uid ()
    ) IN ('admin', 'manager', 'super-admin')
  );

CREATE POLICY "Admins can view all cards." ON cards FOR
SELECT
  USING (
    (
      SELECT
        role
      FROM
        profiles
      WHERE
        id = auth.uid ()
    ) IN ('admin', 'manager', 'super-admin')
  );

CREATE POLICY "Admins can view all addresses." ON addresses FOR
SELECT
  USING (
    (
      SELECT
        role
      FROM
        profiles
      WHERE
        id = auth.uid ()
    ) IN ('admin', 'manager', 'super-admin')
  );

CREATE POLICY "Admins can manage all orders." ON orders FOR ALL USING (
  (
    SELECT
      role
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) IN ('admin', 'manager', 'super-admin')
);

CREATE POLICY "Admins can manage all notifications." ON notifications FOR ALL USING (
  (
    SELECT
      role
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) IN ('admin', 'manager', 'super-admin')
);

CREATE POLICY "Admins have full access to everything." ON offers FOR ALL USING (
  (
    SELECT
      role
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) IN ('admin', 'manager', 'super-admin')
)
WITH
  CHECK (
    (
      SELECT
        role
      FROM
        profiles
      WHERE
        id = auth.uid ()
    ) IN ('admin', 'manager', 'super-admin')
  );

CREATE POLICY "Admins have full access to everything." ON promos FOR ALL USING (
  (
    SELECT
      role
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) IN ('admin', 'manager', 'super-admin')
)
WITH
  CHECK (
    (
      SELECT
        role
      FROM
        profiles
      WHERE
        id = auth.uid ()
    ) IN ('admin', 'manager', 'super-admin')
  );

CREATE POLICY "Admins have full access to everything." ON contact_messages FOR ALL USING (
  (
    SELECT
      role
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) IN ('admin', 'manager', 'super-admin')
)
WITH
  CHECK (
    (
      SELECT
        role
      FROM
        profiles
      WHERE
        id = auth.uid ()
    ) IN ('admin', 'manager', 'super-admin')
  );

-- Create required types
CREATE TYPE public.order_status AS ENUM (
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Failed'
);

CREATE TYPE public.user_role AS ENUM (
  'customer',
  'manager',
  'admin',
  'super-admin'
);

CREATE TYPE public.notification_type AS ENUM (
  'new_order',
  'order_update',
  'new_review',
  'new_question',
  'question_answered',
  'new_refund',
  'refund_update',
  'promotion',
  'security',
  'role_update',
  'new_message'
);

CREATE TYPE public.address_type AS ENUM ('billing', 'shipping');

CREATE TYPE public.review_status AS ENUM (
  'Pending',
  'Approved',
  'Hidden'
);

CREATE TYPE public.question_status AS ENUM ('Pending', 'Answered');

CREATE TYPE public.refund_status AS ENUM (
  'Pending',
  'Approved',
  'Rejected'
);

CREATE TYPE public.offer_status AS ENUM (
  'active',
  'inactive',
  'expired'
);

CREATE TYPE public.promo_status AS ENUM ('active', 'inactive');

CREATE TYPE public.contact_message_status AS ENUM (
  'read',
  'unread'
);

-- Drop all potential old versions of create_order to avoid signature conflicts.
-- This is necessary because CREATE OR REPLACE FUNCTION cannot change argument types or defaults.
DROP FUNCTION IF EXISTS public.create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric);

DROP FUNCTION IF EXISTS public.create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric, text);

DROP FUNCTION IF EXISTS public.create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric, public.order_status);

-- Function to create an order and its items
CREATE
OR REPLACE FUNCTION public.create_order(
  p_total_amount numeric,
  p_shipping_details jsonb,
  p_items jsonb,
  p_payment_method text,
  p_transaction_details jsonb,
  p_coupon_code text,
  p_discount_amount numeric,
  p_initial_status public.order_status DEFAULT 'Pending'::public.order_status
) RETURNS text AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item record;
    new_transaction_id bigint;
BEGIN
    -- Generate a unique order number
    new_order_number := 'KB-' || to_char(now(), 'YYMMDD') || '-' || nextval('orders_id_seq');

    -- Create the order
    INSERT INTO public.orders (
        user_id, order_number, total_amount, status, shipping_details,
        coupon_code, discount_amount
    )
    VALUES (
        auth.uid(), new_order_number, p_total_amount, p_initial_status, p_shipping_details,
        p_coupon_code, p_discount_amount
    )
    RETURNING id INTO new_order_id;
    
    -- Log the initial status in order_history
    INSERT INTO public.order_history (order_id, status)
    VALUES (new_order_id, p_initial_status);

    -- Create order items
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id int, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (new_order_id, item.product_id, item.quantity, item.price);
    END LOOP;

    -- Create transaction
    INSERT INTO public.transactions (order_id, amount, payment_method, status, transaction_details)
    VALUES (new_order_id, p_total_amount, p_payment_method, 'Completed', p_transaction_details)
    RETURNING id INTO new_transaction_id;

    -- Update order with transaction ID
    UPDATE public.orders
    SET transaction_id = new_transaction_id
    WHERE id = new_order_id;

    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

--
-- Name: order_history; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE
  IF NOT EXISTS public.order_history (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    status public.order_status NOT NULL,
    created_at timestamp
    with
      time zone DEFAULT now() NOT NULL
  );

--
-- Name: order_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--
CREATE SEQUENCE
  IF NOT EXISTS public.order_history_id_seq START
  WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.order_history_id_seq OWNED BY public.order_history.id;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--
CREATE SEQUENCE
  IF NOT EXISTS public.orders_id_seq START
  WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE
  IF NOT EXISTS public.orders (
    id bigint DEFAULT nextval('public.orders_id_seq'::regclass) NOT NULL,
    user_id uuid,
    order_number text NOT NULL,
    created_at timestamp
    with
      time zone DEFAULT now() NOT NULL,
      updated_at timestamp
    with
      time zone DEFAULT now(),
      total_amount numeric(10, 2) NOT NULL,
      status public.order_status DEFAULT 'Pending'::public.order_status NOT NULL,
      shipping_details jsonb,
      payment_details jsonb,
      coupon_code text,
      discount_amount numeric(10, 2) DEFAULT 0,
      transaction_id bigint
  );

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--
CREATE SEQUENCE
  IF NOT EXISTS public.order_items_id_seq START
  WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE
  IF NOT EXISTS public.order_items (
    id bigint DEFAULT nextval('public.order_items_id_seq'::regclass) NOT NULL,
    order_id bigint NOT NULL,
    product_id bigint NOT NULL,
    quantity integer NOT NULL,
    price_at_purchase numeric(10, 2) NOT NULL,
    created_at timestamp
    with
      time zone DEFAULT now() NOT NULL
  );

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--
CREATE SEQUENCE
  IF NOT EXISTS public.transactions_id_seq START
  WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE
  IF NOT EXISTS public.transactions (
    id bigint DEFAULT nextval('public.transactions_id_seq'::regclass) NOT NULL,
    order_id bigint,
    user_id uuid,
    amount numeric(10, 2) NOT NULL,
    payment_method text NOT NULL,
    status text DEFAULT 'Pending'::text NOT NULL,
    transaction_details jsonb,
    created_at timestamp
    with
      time zone DEFAULT now() NOT NULL,
      CONSTRAINT chk_status CHECK (
        (
          status = ANY (
            ARRAY['Pending'::text, 'Completed'::text, 'Failed'::text]
          )
        )
      )
  );

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE
  IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    created_at timestamp
    with
      time zone DEFAULT now() NOT NULL,
      updated_at timestamp
    with
      time zone DEFAULT now() NOT NULL,
      full_name text,
      avatar_url text,
      bio text,
      contact_number text,
      role public.user_role DEFAULT 'customer'::public.user_role NOT NULL
  );

ALTER TABLE ONLY public.profiles
ADD
  CONSTRAINT profiles_pkey PRIMARY KEY (id);

-- Add foreign key constraint
ALTER TABLE ONLY public.profiles
ADD
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

