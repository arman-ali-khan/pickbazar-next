--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1
-- Dumped by pg_dump version 15.1 (Debian 15.1-1.pgdg110+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM (
            'Pending',
            'Processing',
            'Shipped',
            'Delivered',
            'Cancelled'
        );
    END IF;
END $$;


--
-- Name: get_admin_order_details(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_admin_order_details(p_order_number text) RETURNS TABLE(id bigint, order_number text, created_at timestamp with time zone, total_amount numeric, status public.order_status, shipping_details jsonb, coupon_code text, discount_amount numeric, payment_method text, transaction_details jsonb, profiles jsonb, order_items jsonb)
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
        o.coupon_code,
        o.discount_amount,
        t.payment_method,
        t.transaction_details,
        jsonb_build_object(
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ) as profiles,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', oi.id,
                    'quantity', oi.quantity,
                    'price_at_purchase', oi.price,
                    'products', jsonb_build_object(
                        'name', pr.name,
                        'featured_image_url', pr.featured_image_url
                    )
                )
            )
            FROM public.order_items oi
            JOIN public.products pr ON oi.product_id = pr.id
            WHERE oi.order_id = o.id
        ) as order_items
    FROM
        public.orders o
    LEFT JOIN
        public.profiles p ON o.user_id = p.id
    LEFT JOIN 
        public.transactions t ON o.id = t.order_id
    WHERE
        o.order_number = p_order_number;
END;
$$;


--
-- Name: get_admin_order_list(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_admin_order_list() RETURNS TABLE(id bigint, order_number text, created_at timestamp with time zone, total_amount numeric, status public.order_status, customer_name text, customer_email text, customer_avatar_url text)
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
    o.shipping_details->>'firstName' || ' ' || o.shipping_details->>'lastName' AS customer_name,
    o.shipping_details->>'email' as customer_email,
    p.avatar_url AS customer_avatar_url
  FROM public.orders o
  LEFT JOIN public.profiles p ON o.user_id = p.id
  ORDER BY o.created_at DESC;
END;
$$;


--
-- Name: create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric, public.order_status); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_order_id bigint;
    new_order_number text;
    item record;
    current_user_id uuid;
BEGIN
    -- Get the current user's ID
    current_user_id := auth.uid();

    -- Generate a unique order number
    new_order_number := 'KB-' || substr(md5(random()::text), 0, 8);

    -- Insert the new order and get its ID
    INSERT INTO public.orders (user_id, order_number, total_amount, shipping_details, status, coupon_code, discount_amount)
    VALUES (current_user_id, new_order_number, p_total_amount, p_shipping_details, p_initial_status, p_coupon_code, p_discount_amount)
    RETURNING id INTO new_order_id;
    
    -- Insert order items
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id bigint, quantity int, price numeric)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price)
        VALUES (new_order_id, item.product_id, item.quantity, item.price);
    END LOOP;

    -- Insert transaction details
    INSERT INTO public.transactions (order_id, user_id, amount, payment_method, transaction_details, status)
    VALUES (new_order_id, current_user_id, p_total_amount, p_payment_method, p_transaction_details, 'Completed');

    RETURN new_order_number;
END;
$$;


--
-- Name: get_all_settings(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_all_settings() RETURNS TABLE(site_title text, site_subtitle text, logo_url text, favicon_url text, link_preview_image_url text, meta_title text, meta_description text, meta_tags text, canonical_url text, og_title text, og_description text, social_links jsonb, enable_cod boolean, enable_mobile_banking boolean, enable_card_payment boolean, maintenance_mode boolean, maintenance_title text, maintenance_description text, maintenance_cover_image_url text, maintenance_end_date text, enable_promo_popup boolean, mobile_banking_number text, mobile_banking_options jsonb, shipping_cost numeric, enable_aamarpay boolean, aamarpay_mode text, aamarpay_sandbox_store_id text, aamarpay_sandbox_signature_key text, aamarpay_production_store_id text, aamarpay_production_signature_key text)
    LANGUAGE plpgsql
    AS $$
BEGIN
RETURN QUERY
  SELECT
    (SELECT value FROM public.settings WHERE key = 'site_title') AS site_title,
    (SELECT value FROM public.settings WHERE key = 'site_subtitle') AS site_subtitle,
    (SELECT value FROM public.settings WHERE key = 'logo_url') AS logo_url,
    (SELECT value FROM public.settings WHERE key = 'favicon_url') AS favicon_url,
    (SELECT value FROM public.settings WHERE key = 'link_preview_image_url') AS link_preview_image_url,
    (SELECT value FROM public.settings WHERE key = 'meta_title') AS meta_title,
    (SELECT value FROM public.settings WHERE key = 'meta_description') AS meta_description,
    (SELECT value FROM public.settings WHERE key = 'meta_tags') AS meta_tags,
    (SELECT value FROM public.settings WHERE key = 'canonical_url') AS canonical_url,
    (SELECT value FROM public.settings WHERE key = 'og_title') AS og_title,
    (SELECT value FROM public.settings WHERE key = 'og_description') AS og_description,
    (SELECT value::jsonb FROM public.settings WHERE key = 'social_links') AS social_links,
    (SELECT value::boolean FROM public.settings WHERE key = 'enable_cod') AS enable_cod,
    (SELECT value::boolean FROM public.settings WHERE key = 'enable_mobile_banking') AS enable_mobile_banking,
    (SELECT value::boolean FROM public.settings WHERE key = 'enable_card_payment') AS enable_card_payment,
    (SELECT value::boolean FROM public.settings WHERE key = 'maintenance_mode') AS maintenance_mode,
    (SELECT value FROM public.settings WHERE key = 'maintenance_title') AS maintenance_title,
    (SELECT value FROM public.settings WHERE key = 'maintenance_description') AS maintenance_description,
    (SELECT value FROM public.settings WHERE key = 'maintenance_cover_image_url') AS maintenance_cover_image_url,
    (SELECT value FROM public.settings WHERE key = 'maintenance_end_date') AS maintenance_end_date,
    (SELECT value::boolean FROM public.settings WHERE key = 'enable_promo_popup') AS enable_promo_popup,
    (SELECT value FROM public.settings WHERE key = 'mobile_banking_number') AS mobile_banking_number,
    (SELECT value::jsonb FROM public.settings WHERE key = 'mobile_banking_options') AS mobile_banking_options,
    (SELECT value::numeric FROM public.settings WHERE key = 'shipping_cost') AS shipping_cost,
    (SELECT value::boolean FROM public.settings WHERE key = 'enable_aamarpay') AS enable_aamarpay,
    (SELECT value FROM public.settings WHERE key = 'aamarpay_mode') AS aamarpay_mode,
    (SELECT value FROM public.settings WHERE key = 'aamarpay_sandbox_store_id') AS aamarpay_sandbox_store_id,
    (SELECT value FROM public.settings WHERE key = 'aamarpay_sandbox_signature_key') AS aamarpay_sandbox_signature_key,
    (SELECT value FROM public.settings WHERE key = 'aamarpay_production_store_id') AS aamarpay_production_store_id,
    (SELECT value FROM public.settings WHERE key = 'aamarpay_production_signature_key') AS aamarpay_production_signature_key;
END;
$$;


--
-- Name: get_order_history(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_order_history(p_order_id bigint) RETURNS TABLE(status text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT oh.status, oh.created_at
    FROM public.order_history oh
    WHERE oh.order_id = p_order_id
    ORDER BY oh.created_at DESC;
END;
$$;


--
-- Name: log_order_status_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.log_order_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO public.order_history (order_id, status)
  VALUES (NEW.id, NEW.status);
  RETURN NEW;
END;
$$;


--
-- Name: update_order_status_and_log(bigint, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_order_status_and_log(p_order_id bigint, p_new_status text) RETURNS TABLE(id bigint, order_number text, user_id uuid, created_at timestamp with time zone, total_amount numeric, status public.order_status, shipping_details jsonb, coupon_code text, discount_amount numeric, payment_details jsonb)
    LANGUAGE plpgsql
    AS $$
DECLARE
  updated_order public.orders;
BEGIN
  UPDATE public.orders
  SET status = p_new_status::order_status
  WHERE public.orders.id = p_order_id
  RETURNING * INTO updated_order;

  -- The trigger will automatically log the history.

  RETURN QUERY SELECT * FROM public.orders WHERE public.orders.id = p_order_id;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.addresses (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    street_address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip text NOT NULL,
    country text NOT NULL,
    address_type text DEFAULT 'shipping'::text NOT NULL
);


--
-- Name: cards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.cards (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    card_type text,
    last4 text,
    expiry_month integer,
    expiry_year integer
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.categories (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    parent_id bigint,
    icon text
);


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    subject text,
    message text NOT NULL,
    status text DEFAULT 'unread'::text NOT NULL
);


--
-- Name: home_page_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.home_page_sections (
    id bigint NOT NULL,
    category_id bigint NOT NULL,
    display_order integer NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    title text NOT NULL,
    message text,
    is_read boolean DEFAULT false NOT NULL,
    link text,
    type text
);


--
-- Name: offers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.offers (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    subtitle text,
    code text NOT NULL,
    discount_percentage numeric NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    image_url text,
    category_ids bigint[],
    product_ids bigint[]
);


--
-- Name: order_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.order_history (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    status public.order_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.order_items (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    product_id bigint NOT NULL,
    quantity integer NOT NULL,
    price numeric NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.orders (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    total_amount numeric NOT NULL,
    status public.order_status DEFAULT 'Pending'::public.order_status NOT NULL,
    shipping_details jsonb,
    order_number text NOT NULL,
    coupon_code text,
    discount_amount numeric DEFAULT 0,
    payment_details jsonb
);


--
-- Name: pages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.pages (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    content jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.product_categories (
    product_id bigint NOT NULL,
    category_id bigint NOT NULL
);


--
-- Name: product_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.product_tags (
    product_id bigint NOT NULL,
    tag_id bigint NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.products (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric NOT NULL,
    original_price numeric,
    stock integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    featured_image_url text,
    gallery_urls text[],
    unit text,
    view_count integer DEFAULT 0
);


--
-- Name: promos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.promos (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    subtitle text,
    button_text text,
    button_link text,
    image_url text,
    status text DEFAULT 'active'::text NOT NULL
);


--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.questions (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    question_text text NOT NULL,
    answer_text text,
    status text DEFAULT 'Pending'::text NOT NULL,
    answered_at timestamp with time zone
);


--
-- Name: refunds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.refunds (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    order_id bigint NOT NULL,
    user_id uuid NOT NULL,
    amount numeric NOT NULL,
    reason text,
    status text DEFAULT 'Pending'::text NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.reviews (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL,
    rating integer NOT NULL,
    text text,
    status text DEFAULT 'Pending'::text NOT NULL
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.settings (
    id bigint NOT NULL,
    key text NOT NULL,
    value text
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.tags (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.transactions (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    order_id bigint NOT NULL,
    user_id uuid NOT NULL,
    amount numeric NOT NULL,
    payment_method text NOT NULL,
    status text NOT NULL,
    transaction_details jsonb
);


--
-- Name: wishlist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.wishlist (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    product_id bigint NOT NULL
);


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

--
-- Data for Name: cards; Type: TABLE DATA; Schema: public; Owner: postgres
--

--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.categories (id, created_at, name, slug, description, parent_id, icon) OVERRIDING SYSTEM VALUE VALUES
(1, '2024-07-25 15:00:54.685392+00', 'Fruits & Vegetables', 'fruits-vegetables', NULL, NULL, 'Apple'),
(2, '2024-07-25 15:00:54.685392+00', 'Meat & Fish', 'meat-fish', NULL, NULL, 'Beef'),
(3, '2024-07-25 15:00:54.685392+00', 'Snacks', 'snacks', NULL, NULL, 'Cookie'),
(4, '2024-07-25 15:00:54.685392+00', 'Pet Care', 'pet-care', NULL, NULL, 'Dog'),
(5, '2024-07-25 15:00:54.685392+00', 'Home & Cleaning', 'home-cleaning', NULL, NULL, 'Home'),
(6, '2024-07-25 15:00:54.685392+00', 'Dairy', 'dairy', NULL, NULL, 'Milk'),
(7, '2024-07-25 15:00:54.685392+00', 'Cooking', 'cooking', NULL, NULL, 'Soup'),
(8, '2024-07-25 15:00:54.685392+00', 'Breakfast', 'breakfast', NULL, NULL, 'Cake'),
(9, '2024-07-25 15:00:54.685392+00', 'Beverage', 'beverage', NULL, NULL, 'GlassWater'),
(10, '2024-07-25 15:00:54.685392+00', 'Beauty & Health', 'beauty-health', NULL, NULL, 'Heart'),
(11, '2024-07-25 15:01:03.49015+00', 'Fruits', 'fruits', NULL, 1, 'Grape'),
(12, '2024-07-25 15:01:10.535805+00', 'Vegetables', 'vegetables', NULL, 1, 'Carrot');


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

--
-- Data for Name: home_page_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.home_page_sections (id, category_id, display_order) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 0),
(2, 2, 1);


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

--
-- Data for Name: offers; Type: TABLE DATA; Schema: public; Owner: postgres
--

--
-- Data for Name: order_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

--
-- Data for Name: pages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pages (id, created_at, slug, title, content, updated_at) OVERRIDING SYSTEM VALUE VALUES
(1, '2024-07-25 15:00:54.730303+00', 'about', 'About Us', '{"bio": "This is the CEO bio.", "name": "John Doe", "role": "CEO", "team": [{"bio": "<p>With over 20 years of experience in the grocery industry, John is a visionary leader dedicated to bringing fresh, high-quality products to your doorstep. His passion for innovation and customer satisfaction drives the company''s mission.</p>", "name": "John Doe", "role": "CEO & Founder"}, {"bio": "<p>Jane orchestrates the complex logistics of our operations, ensuring that every order is delivered on time and with the utmost care. Her expertise in supply chain management is the backbone of our service.</p>", "name": "Jane Smith", "role": "Head of Operations"}, {"bio": "<p>Peter leads our talented team of developers, constantly improving our platform to provide you with a seamless and enjoyable shopping experience. He is passionate about using technology to solve real-world problems.</p>", "name": "Peter Jones", "role": "Lead Developer"}], "title": "Serving You Freshness, Every Day", "teamTitle": "Meet the Team", "missionText": "<p>Our mission is simple: to revolutionize the way you shop for groceries. We believe that everyone deserves access to fresh, healthy food without the hassle of crowded stores and long checkout lines. By partnering with local farmers and trusted suppliers, we bring the best of the market directly to you, ensuring quality and freshness in every order.</p>", "missionTitle": "Our Mission: Freshness Delivered", "subtitle": "We are a passionate team dedicated to bringing you the freshest groceries with the convenience of online shopping. Learn more about our story and our commitment to quality."}', '2024-07-25 15:00:54.730303+00'),
(2, '2024-07-25 15:00:54.730303+00', 'contact', 'Contact Us', '{"email": "support@karwanbazar.com", "phone": "+1 (234) 567-8900", "address": "123 Grocery Lane, Foodie City, 54321"}', '2024-07-25 15:00:54.730303+00'),
(3, '2024-07-25 15:00:54.730303+00', 'faq', 'Frequently Asked Questions', '{"faqs": [{"answer": "You can track your order in real-time from the ''My Orders'' section of your account. You will also receive SMS and email updates at every stage of your order.", "question": "How do I track my order?"}, {"answer": "We have a no-questions-asked return policy for most items within 24 hours of delivery, provided the items are in their original packaging and condition. Please check the item description for specific return information.", "question": "What is your return policy?"}]}', '2024-07-25 15:00:54.730303+00'),
(4, '2024-07-25 15:00:54.730303+00', 'privacy-policy', 'Privacy Policy', '{"html": "<h1>Privacy Policy for Karwanbazar</h1><p>Your privacy is important to us. It is Karwanbazar''s policy to respect your privacy regarding any information we may collect from you across our website.</p>"}', '2024-07-25 15:00:54.730303+00'),
(5, '2024-07-25 15:00:54.730303+00', 'terms-and-conditions', 'Terms & Conditions', '{"html": "<h1>Terms and Conditions</h1><p>By accessing this website we assume you accept these terms and conditions. Do not continue to use Karwanbazar if you do not agree to take all of the terms and conditions stated on this page.</p>"}', '2024-07-25 15:00:54.730303+00');


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.product_categories (product_id, category_id) OVERRIDING SYSTEM VALUE VALUES
(1, 11),
(2, 12),
(3, 11),
(4, 12),
(5, 11),
(6, 12),
(7, 12),
(8, 11),
(9, 12),
(10, 12),
(11, 12),
(12, 12),
(13, 12);


--
-- Data for Name: product_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.product_tags (product_id, tag_id) OVERRIDING SYSTEM VALUE VALUES
(1, 1),
(1, 2),
(2, 1);


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.products (id, created_at, name, slug, description, price, original_price, stock, status, featured_image_url, gallery_urls, unit, view_count) OVERRIDING SYSTEM VALUE VALUES
(1, '2024-07-25 15:00:54.72109+00', 'Apples', 'apples', 'Crisp and juicy red apples, perfect for a healthy snack.', 1.6, 2, 100, 'active', 'https://images.unsplash.com/photo-1439127989242-c3749a012eac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxyZWQlMjBhcHBsZXN8ZW58MHx8fHwxNzY4ODg3MzQxfDA&ixlib=rb-4.1.0&q=80&w=1080', '{https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxyZWQlMjBhcHBsZXxlbnwwfHx8fDE3Njg4NTMxMjN8MA&ixlib=rb-4.1.0&q=80&w=1080,https://images.unsplash.com/photo-1590005354167-6da97870c757?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxhcHBsZSUyMHNsaWNlfGVufDB8fHx8MTc2ODkwMDg2NHww&ixlib=rb-4.1.0&q=80&w=1080}', '1lb', 10),
(2, '2024-07-25 15:00:54.72109+00', 'Baby Spinach', 'baby-spinach', 'Tender baby spinach leaves, great for salads.', 0.6, NULL, 50, 'active', 'https://images.unsplash.com/photo-1598278242809-6c21ee17aef1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxzcGluYWNofGVufDB8fHx8MTc2ODk3ODI1N3ww&ixlib=rb-4.1.0&q=80&w=1080', '{}', '2lb', 5),
(3, '2024-07-25 15:00:54.72109+00', 'Blueberries', 'blueberries', 'Sweet and juicy blueberries, packed with antioxidants.', 3, NULL, 75, 'active', 'https://images.unsplash.com/photo-1606757389667-45c2024f9fa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxibHVlYmVycmllc3xlbnwwfHx8fDE3Njg5MDQ2ODR8MA&ixlib=rb-4.1.0&q=80&w=1080', '{}', '1lb', 8),
(4, '2024-07-25 15:00:54.72109+00', 'Brussels Sprout', 'brussels-sprout', 'Fresh Brussels sprouts, great for roasting.', 3.69, 4.5, 30, 'active', 'https://images.unsplash.com/photo-1670843840538-9fe8d95b59f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxicnVzc2VscyUyMHNwcm91dHxlbnwwfHx8fDE3Njg5MDA4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080', '{}', '1lb', 12),
(5, '2024-07-25 15:00:54.72109+00', 'Clementines', 'clementines', 'Sweet and easy-to-peel clementines.', 2.5, 2.75, 60, 'active', 'https://images.unsplash.com/photo-1706773183787-c03c3eb709f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxjbGVtZW50aW5lc3xlbnwwfHx8fDE3Njg5MDA4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080', '{}', '1lb', 15),
(6, '2024-07-25 15:00:54.72109+00', 'Sweet Corn', 'sweet-corn', 'Fresh sweet corn, perfect for grilling.', 1.8, NULL, 40, 'active', 'https://images.unsplash.com/photo-1675501342249-bdaaeb27c5cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxzd2VldCUyMGNvcm58ZW58MHx8fHwxNzY4OTAwODY0fDA&ixlib=rb-4.1.0&q=80&w=1080', '{}', '1lb', 20),
(7, '2024-07-25 15:00:54.72109+00', 'Cucumber', 'cucumber', 'Crisp and refreshing cucumber.', 0.75, NULL, 80, 'active', 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxjdWN1bWJlcnxlbnwwfHx8fDE3Njg5MDA4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080', '{}', '1pc', 2),
(8, '2024-07-25 15:00:54.72109+00', 'Dates', 'dates', 'Sweet and chewy dates.', 4.5, NULL, 25, 'active', 'https://images.unsplash.com/photo-1649335889120-4084d7456c7c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxkYXRlc3xlbnwwfHx8fDE3Njg5MDA4NjR8MA&ixlib=rb-4.1.0&q=80&w=1080', '{}', '250g', 18),
(9, '2024-07-25 15:00:54.72109+00', 'French Green Beans', 'french-green-beans', 'Tender French green beans.', 2.2, NULL, 35, 'active', 'https://images.unsplash.com/photo-1574963835594-61eede2070dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxncmVlbiUyMGJlYW5zfGVufDB8fHx8MTc2ODkwMDg2NHww&ixlib=rb-4.1.0&q=80&w=1080', '{}', '1lb', 7),
(10, '2024-07-25 15:00:54.72109+00', 'Radish', 'radish', 'Crisp and peppery radish.', 2.11, 2.59, 45, 'active', 'https://images.unsplash.com/photo-1687199129802-3e4cc27baac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxmcmVzaCUyMHJhZGlzaGVzfGVufDB8fHx8MTc2ODk3ODI1OHww&ixlib=rb-4.1.0&q=80&w=1080', '{}', '1lbs', 22),
(11, '2024-07-25 15:00:54.72109+00', 'Wegman''s Carrots', 'wegmans-carrots', 'Sweet and crunchy carrots from Wegman''s farm.', 2.1, NULL, 90, 'active', 'https://images.unsplash.com/photo-1741518359356-623aa8385826?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxmcmVzaCUyMGNhcnJvdHN8ZW58MHx8fHwxNzY4OTExMDI2fDA&ixlib=rb-4.1.0&q=80&w=1080', '{}', '1lbs', 30),
(12, '2024-07-25 15:00:54.72109+00', 'White Radish', 'white-radish', 'Mild and crisp white radish, also known as daikon.', 2.99, NULL, 55, 'active', 'https://images.unsplash.com/photo-1593629718347-283811841101?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHx3aGl0ZSUyMHJhZGlzaHxlbnwwfHx8fDE3Njg5NzgyNTh8MA&ixlib=rb-4.1.0&q=80&w=1080', '{}', '1lbs', 11),
(13, '2024-07-25 15:00:54.72109+00', 'Baby Radish', 'baby-radish', 'Small and tender baby radishes, perfect for salads.', 1, NULL, 20, 'active', 'https://images.unsplash.com/photo-1528826234716-96aaa8e9a413?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxiYWJ5JTIwdHVybmlwfGVufDB8fHx8MTc2ODk3ODI1OHww&ixlib=rb-4.1.0&q=80&w=1080', '{}', '1lbs', 4);


--
-- Data for Name: promos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.promos (id, created_at, title, subtitle, button_text, button_link, image_url, status) OVERRIDING SYSTEM VALUE VALUES
(1, '2024-07-25 15:00:54.74305+00', 'Get 25% Discount', 'Subscribe to the mailing list to receive updates on new arrivals, special offers and our promotions.', 'Subscribe', '/subscribe', 'https://images.unsplash.com/photo-1579113800036-39db37a94532?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxmcmVzaCUyMGZydWl0c3xlbnwwfHx8fDE3Njg3ODI1NTV8MA&ixlib=rb-4.1.0&q=80&w=1080', 'active');


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: postgres
--

--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.settings (id, key, value) OVERRIDING SYSTEM VALUE VALUES
(1, 'site_title', 'Pickbazar'),
(2, 'site_subtitle', 'Your one-stop shop for fresh, high-quality groceries delivered to your door.'),
(3, 'logo_url', 'https://asset.brandfetch.io/id20mKE917/id27x35H4b.svg'),
(4, 'meta_title', 'Pickbazar - Fresh Groceries Delivered'),
(5, 'meta_description', 'Order fresh groceries online from Pickbazar and get them delivered to your doorstep. Wide selection of fruits, vegetables, meat, and more.'),
(6, 'enable_cod', 'true'),
(7, 'enable_mobile_banking', 'true'),
(8, 'enable_card_payment', 'false'),
(9, 'maintenance_mode', 'false'),
(10, 'enable_promo_popup', 'true'),
(11, 'social_links', '[{"icon": "Facebook", "url": "https://facebook.com"}, {"icon": "Twitter", "url": "https://twitter.com"}, {"icon": "Instagram", "url": "https://instagram.com"}]'),
(12, 'mobile_banking_number', '01234567890'),
(13, 'mobile_banking_options', '["bKash", "Nagad"]'),
(14, 'shipping_cost', '5'),
(15, 'enable_aamarpay', 'false');


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tags (id, created_at, name, slug) OVERRIDING SYSTEM VALUE VALUES
(1, '2024-07-25 15:00:54.693444+00', 'Fresh', 'fresh'),
(2, '2024-07-25 15:00:54.693444+00', 'Organic', 'organic'),
(3, '2024-07-25 15:00:54.693444+00', 'Sale', 'sale');


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

--
-- Data for Name: wishlist; Type: TABLE DATA; Schema: public; Owner: postgres
--

--
-- Name: addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

--
-- Name: cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 12, true);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

--
-- Name: home_page_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.home_page_sections_id_seq', 2, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

--
-- Name: offers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

--
-- Name: order_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

--
-- Name: pages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pages_id_seq', 5, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 13, true);


--
-- Name: promos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promos_id_seq', 1, true);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

--
-- Name: refunds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_id_seq', 15, true);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tags_id_seq', 3, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

--
-- Name: wishlist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

--
-- Name: log_order_status_change_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

DROP TRIGGER IF EXISTS log_order_status_change_trigger ON public.orders;
CREATE TRIGGER log_order_status_change_trigger AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();


--
-- Name: update_pages_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

--
-- Name: addresses Allow delete for users based on user_id; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow delete for users based on user_id" ON public.addresses;
CREATE POLICY "Allow delete for users based on user_id" ON public.addresses FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: cards Allow delete for users based on user_id; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow delete for users based on user_id" ON public.cards;
CREATE POLICY "Allow delete for users based on user_id" ON public.cards FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: orders Allow delete for users based on user_id; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow delete for users based on user_id" ON public.orders;
CREATE POLICY "Allow delete for users based on user_id" ON public.orders FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: refunds Allow delete for users based on user_id; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow delete for users based on user_id" ON public.refunds;
CREATE POLICY "Allow delete for users based on user_id" ON public.refunds FOR DELETE USING (((auth.uid() = user_id) AND (status = 'Pending'::text)));


--
-- Name: wishlist Allow delete for users based on user_id; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow delete for users based on user_id" ON public.wishlist;
CREATE POLICY "Allow delete for users based on user_id" ON public.wishlist FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: addresses Allow insert for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow insert for authenticated users only" ON public.addresses;
CREATE POLICY "Allow insert for authenticated users only" ON public.addresses FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: cards Allow insert for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow insert for authenticated users only" ON public.cards;
CREATE POLICY "Allow insert for authenticated users only" ON public.cards FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: notifications Allow individual insert access; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow individual insert access" ON public.notifications;
CREATE POLICY "Allow individual insert access" ON public.notifications FOR INSERT WITH CHECK (true);


--
-- Name: questions Allow individual insert access; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow individual insert access" ON public.questions;
CREATE POLICY "Allow individual insert access" ON public.questions FOR INSERT WITH CHECK (true);


--
-- Name: reviews Allow individual insert access; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow individual insert access" ON public.reviews;
CREATE POLICY "Allow individual insert access" ON public.reviews FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: refunds Allow individual read access; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow individual read access" ON public.refunds;
CREATE POLICY "Allow individual read access" ON public.refunds FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: transactions Allow individual read access; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow individual read access" ON public.transactions;
CREATE POLICY "Allow individual read access" ON public.transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: addresses Allow read access for owner; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow read access for owner" ON public.addresses;
CREATE POLICY "Allow read access for owner" ON public.addresses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: cards Allow read access for owner; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow read access for owner" ON public.cards;
CREATE POLICY "Allow read access for owner" ON public.cards FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Allow read access for owner; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow read access for owner" ON public.notifications;
CREATE POLICY "Allow read access for owner" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: orders Allow read access for owner; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow read access for owner" ON public.orders;
CREATE POLICY "Allow read access for owner" ON public.orders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: questions Allow read access for owner; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow read access for owner" ON public.questions;
CREATE POLICY "Allow read access for owner" ON public.questions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wishlist Allow read access for owner; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow read access for owner" ON public.wishlist;
CREATE POLICY "Allow read access for owner" ON public.wishlist FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: addresses Allow update for users based on user_id; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow update for users based on user_id" ON public.addresses;
CREATE POLICY "Allow update for users based on user_id" ON public.addresses FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: notifications Allow update for users based on user_id; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Allow update for users based on user_id" ON public.notifications;
CREATE POLICY "Allow update for users based on user_id" ON public.notifications FOR UPDATE USING (((auth.uid() = user_id) AND (is_read = false)));


--
-- Name: categories Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Enable read access for all users" ON public.categories;
CREATE POLICY "Enable read access for all users" ON public.categories FOR SELECT USING (true);


--
-- Name: contact_messages Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Enable read access for all users" ON public.contact_messages;
CREATE POLICY "Enable read access for all users" ON public.contact_messages FOR SELECT USING (true);


--
-- Name: home_page_sections Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Enable read access for all users" ON public.home_page_sections;
CREATE POLICY "Enable read access for all users" ON public.home_page_sections FOR SELECT USING (true);


--
-- Name: offers Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Enable read access for all users" ON public.offers;
CREATE POLICY "Enable read access for all users" ON public.offers FOR SELECT USING (true);


--
-- Name: order_items Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Enable read access for all users" ON public.order_items;
CREATE POLICY "Enable read access for all users" ON public.order_items FOR SELECT USING (true);


--
-- Name: pages Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Enable read access for all users" ON public.pages;
CREATE POLICY "Enable read access for all users" ON public.pages FOR SELECT USING (true);


--
-- Name: product_categories Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_categories;
CREATE POLICY "Enable read access for all users" ON public.product_categories FOR SELECT USING (true);


--
-- Name: product_tags Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_tags;
CREATE POLICY "Enable read access for all users" ON public.product_tags FOR SELECT USING (true);


--
-- Name: products Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);


--
-- Name: promos Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Enable read access for all users" ON public.promos;
CREATE POLICY "Enable read access for all users" ON public.promos FOR SELECT USING (true);


--
-- Name: questions Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Enable read access for all users" ON public.questions;
CREATE POLICY "Enable read access for all users" ON public.questions FOR SELECT USING (true);


--
-- Name: reviews Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Enable read access for all users" ON public.reviews;
CREATE POLICY "Enable read access for all users" ON public.reviews FOR SELECT USING (true);


--
-- Name: settings Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Enable read access for all users" ON public.settings;
CREATE POLICY "Enable read access for all users" ON public.settings FOR SELECT USING (true);


--
-- Name: tags Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Enable read access for all users" ON public.tags;
CREATE POLICY "Enable read access for all users" ON public.tags FOR SELECT USING (true);


--
-- Name: contact_messages Give users access to own folder; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Give users access to own folder" ON public.contact_messages;
CREATE POLICY "Give users access to own folder" ON public.contact_messages FOR INSERT WITH CHECK (true);


--
-- Name: orders Insert own order; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Insert own order" ON public.orders;
CREATE POLICY "Insert own order" ON public.orders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: wishlist Users can insert their own wishlist items; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Users can insert their own wishlist items" ON public.wishlist;
CREATE POLICY "Users can insert their own wishlist items" ON public.wishlist FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: refunds Users can submit refund requests for their own orders; Type: POLICY; Schema: public; Owner: postgres
--

DROP POLICY IF EXISTS "Users can submit refund requests for their own orders" ON public.refunds;
CREATE POLICY "Users can submit refund requests for their own orders" ON public.refunds FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: addresses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

--
-- Name: cards; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: home_page_sections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: offers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: pages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

--
-- Name: product_categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: product_tags; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: promos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;

--
-- Name: questions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

--
-- Name: refunds; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

--
-- Name: tags; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: wishlist; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION get_admin_order_details(p_order_number text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_admin_order_details(p_order_number text) TO anon;
GRANT ALL ON FUNCTION public.get_admin_order_details(p_order_number text) TO authenticated;
GRANT ALL ON FUNCTION public.get_admin_order_details(p_order_number text) TO service_role;


--
-- Name: FUNCTION get_admin_order_list(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_admin_order_list() TO anon;
GRANT ALL ON FUNCTION public.get_admin_order_list() TO authenticated;
GRANT ALL ON FUNCTION public.get_admin_order_list() TO service_role;


--
-- Name: FUNCTION create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status) TO anon;
GRANT ALL ON FUNCTION public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status) TO authenticated;
GRANT ALL ON FUNCTION public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status) TO service_role;


--
-- Name: FUNCTION get_all_settings(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_all_settings() TO anon;
GRANT ALL ON FUNCTION public.get_all_settings() TO authenticated;
GRANT ALL ON FUNCTION public.get_all_settings() TO service_role;


--
-- Name: FUNCTION get_order_history(p_order_id bigint); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_order_history(p_order_id bigint) TO anon;
GRANT ALL ON FUNCTION public.get_order_history(p_order_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.get_order_history(p_order_id bigint) TO service_role;


--
-- Name: FUNCTION log_order_status_change(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.log_order_status_change() TO anon;
GRANT ALL ON FUNCTION public.log_order_status_change() TO authenticated;
GRANT ALL ON FUNCTION public.log_order_status_change() TO service_role;


--
-- Name: FUNCTION update_order_status_and_log(p_order_id bigint, p_new_status text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_order_status_and_log(p_order_id bigint, p_new_status text) TO anon;
GRANT ALL ON FUNCTION public.update_order_status_and_log(p_order_id bigint, p_new_status text) TO authenticated;
GRANT ALL ON FUNCTION public.update_order_status_and_log(p_order_id bigint, p_new_status text) TO service_role;


--
-- Name: TABLE addresses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.addresses TO anon;
GRANT ALL ON TABLE public.addresses TO authenticated;
GRANT ALL ON TABLE public.addresses TO service_role;


--
-- Name: TABLE cards; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.cards TO anon;
GRANT ALL ON TABLE public.cards TO authenticated;
GRANT ALL ON TABLE public.cards TO service_role;


--
-- Name: TABLE categories; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.categories TO anon;
GRANT ALL ON TABLE public.categories TO authenticated;
GRANT ALL ON TABLE public.categories TO service_role;


--
-- Name: TABLE contact_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contact_messages TO anon;
GRANT ALL ON TABLE public.contact_messages TO authenticated;
GRANT ALL ON TABLE public.contact_messages TO service_role;


--
-- Name: TABLE home_page_sections; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.home_page_sections TO anon;
GRANT ALL ON TABLE public.home_page_sections TO authenticated;
GRANT ALL ON TABLE public.home_page_sections TO service_role;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;


--
-- Name: TABLE offers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.offers TO anon;
GRANT ALL ON TABLE public.offers TO authenticated;
GRANT ALL ON TABLE public.offers TO service_role;


--
-- Name: TABLE order_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.order_history TO anon;
GRANT ALL ON TABLE public.order_history TO authenticated;
GRANT ALL ON TABLE public.order_history TO service_role;


--
-- Name: TABLE order_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.order_items TO anon;
GRANT ALL ON TABLE public.order_items TO authenticated;
GRANT ALL ON TABLE public.order_items TO service_role;


--
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.orders TO anon;
GRANT ALL ON TABLE public.orders TO authenticated;
GRANT ALL ON TABLE public.orders TO service_role;


--
-- Name: TABLE pages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pages TO anon;
GRANT ALL ON TABLE public.pages TO authenticated;
GRANT ALL ON TABLE public.pages TO service_role;


--
-- Name: TABLE product_categories; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.product_categories TO anon;
GRANT ALL ON TABLE public.product_categories TO authenticated;
GRANT ALL ON TABLE public.product_categories TO service_role;


--
-- Name: TABLE product_tags; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.product_tags TO anon;
GRANT ALL ON TABLE public.product_tags TO authenticated;
GRANT ALL ON TABLE public.product_tags TO service_role;


--
-- Name: TABLE products; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.products TO anon;
GRANT ALL ON TABLE public.products TO authenticated;
GRANT ALL ON TABLE public.products TO service_role;


--
-- Name: TABLE promos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.promos TO anon;
GRANT ALL ON TABLE public.promos TO authenticated;
GRANT ALL ON TABLE public.promos TO service_role;


--
-- Name: TABLE questions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.questions TO anon;
GRANT ALL ON TABLE public.questions TO authenticated;
GRANT ALL ON TABLE public.questions TO service_role;


--
-- Name: TABLE refunds; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.refunds TO anon;
GRANT ALL ON TABLE public.refunds TO authenticated;
GRANT ALL ON TABLE public.refunds TO service_role;


--
-- Name: TABLE reviews; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.reviews TO anon;
GRANT ALL ON TABLE public.reviews TO authenticated;
GRANT ALL ON TABLE public.reviews TO service_role;


--
-- Name: TABLE settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.settings TO anon;
GRANT ALL ON TABLE public.settings TO authenticated;
GRANT ALL ON TABLE public.settings TO service_role;


--
-- Name: TABLE tags; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tags TO anon;
GRANT ALL ON TABLE public.tags TO authenticated;
GRANT ALL ON TABLE public.tags TO service_role;


--
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.transactions TO anon;
GRANT ALL ON TABLE public.transactions TO authenticated;
GRANT ALL ON TABLE public.transactions TO service_role;


--
-- Name: TABLE wishlist; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.wishlist TO anon;
GRANT ALL ON TABLE public.wishlist TO authenticated;
GRANT ALL ON TABLE public.wishlist TO service_role;

```