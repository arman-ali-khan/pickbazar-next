-- supabase/seed.sql
--
-- This file is used to seed the database with initial data.
-- It is run automatically by the Supabase CLI when you run `supabase db reset`.
--
-- For more information, see the Supabase documentation:
-- https://supabase.com/docs/guides/database/seeding

-- Create a sample user
--
-- Note: This user is for demonstration purposes only and should be
--       removed or replaced with your own users in a production environment.
--
insert into
  auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
  )
values
  (
    '00000000-0000-0000-0000-000000000000',
    '33828731-8e3a-4c28-b3de-6893e9b7245b',
    'authenticated',
    'authenticated',
    'user@example.com',
    '$2a$10$ihst8a/2S5lQJ86x5y.9Su.655VYLF3i13yYyAAYk2adk3pAR5O7q',
    '2024-07-31 16:53:23.70823+00',
    '',
    null,
    '',
    '',
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"avatar_url": "https://picsum.photos/seed/user-avatar/200", "full_name": "John Doe"}',
    false,
    '2024-07-31 16:53:23.70823+00',
    '2024-07-31 16:53:23.70823+00',
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44828731-8e3a-4c28-b3de-6893e9b7245b',
    'authenticated',
    'authenticated',
    'admin@example.com',
    '$2a$10$ihst8a/2S5lQJ86x5y.9Su.655VYLF3i13yYyAAYk2adk3pAR5O7q',
    '2024-07-31 16:53:23.70823+00',
    '',
    null,
    '',
    '',
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"avatar_url": "https://picsum.photos/seed/admin-avatar/200", "full_name": "Admin User"}',
    false,
    '2024-07-31 16:53:23.70823+00',
    '2024-07-31 16:53:23.70823+00',
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null
  );

-- Create profiles for the sample users
insert into
  public.profiles (id, full_name, avatar_url, role)
values
  (
    '33828731-8e3a-4c28-b3de-6893e9b7245b',
    'John Doe',
    'https://picsum.photos/seed/user-avatar/200',
    'customer'
  ),
  (
    '44828731-8e3a-4c28-b3de-6893e9b7245b',
    'Admin User',
    'https://picsum.photos/seed/admin-avatar/200',
    'super-admin'
  );

-- Seed other tables
insert into public.categories (name, slug, description, parent_id, icon) values
('Fruits & Vegetables', 'fruits-vegetables', 'Fresh fruits and vegetables', null, 'Apple'),
('Meat & Fish', 'meat-fish', 'Fresh meat and fish', null, 'Beef'),
('Dairy & Eggs', 'dairy-eggs', 'Milk, cheese, yogurt, and eggs', null, 'Milk'),
('Bakery', 'bakery', 'Freshly baked bread, cakes, and pastries', null, 'Cake'),
('Snacks', 'snacks', 'Chips, cookies, and other snacks', null, 'Cookie');

insert into public.categories (name, slug, description, parent_id, icon) values
('Fruits', 'fruits', 'All kinds of fresh fruits', 1, 'Grape'),
('Vegetables', 'vegetables', 'All kinds of fresh vegetables', 1, 'Carrot'),
('Beef', 'beef', 'Cuts of beef', 2, 'Beef'),
('Poultry', 'poultry', 'Chicken, turkey, and other poultry', 2, 'Bird'),
('Fish', 'fish', 'Fresh and frozen fish', 2, 'Fish');

insert into public.tags (name, slug) values
('Organic', 'organic'),
('Gluten-Free', 'gluten-free'),
('On Sale', 'on-sale'),
('New Arrival', 'new-arrival'),
('Featured', 'featured');

insert into public.products (name, slug, description, unit, price, original_price, stock, status, featured_image_url, gallery_urls, view_count, rating) values
('Fresh Banana', 'fresh-banana', 'A ripe, yellow banana, rich in potassium.', '1 pc', 0.50, null, 150, 'active', 'https://picsum.photos/seed/banana/800/800', '[]', 10, 4.5),
('Organic Avocado', 'organic-avocado', 'Creamy and delicious organic avocado.', '1 pc', 1.50, 1.75, 80, 'active', 'https://picsum.photos/seed/avocado/800/800', '[]', 25, 4.8),
('Chicken Breast', 'chicken-breast', 'Skinless, boneless chicken breast.', '1 lb', 5.99, null, 50, 'active', 'https://picsum.photos/seed/chicken/800/800', '[]', 5, 4.2);

insert into public.product_categories (product_id, category_id) values
(1, 6), -- Fresh Banana in Fruits
(2, 6), -- Organic Avocado in Fruits
(3, 9); -- Chicken Breast in Poultry

insert into public.product_tags (product_id, tag_id) values
(1, 4), -- Fresh Banana is New Arrival
(2, 1), -- Organic Avocado is Organic
(2, 4); -- Organic Avocado is also New Arrival

insert into public.pages (slug, title, content, updated_at) values
('about', 'About Us', '{"title": "About Karwanbazar", "subtitle": "Your friendly neighborhood online grocery store.", "missionTitle": "Our Mission", "missionText": "<p>To provide the freshest groceries with the fastest delivery, making healthy eating convenient for everyone.</p>", "teamTitle": "Meet the Team", "team": [{"name": "John Doe", "role": "CEO & Founder", "bio": "<p>John is passionate about fresh food and technology.</p>"}, {"name": "Jane Smith", "role": "Head of Operations", "bio": "<p>Jane ensures everything runs smoothly from farm to your door.</p>"}, {"name": "Peter Jones", "role": "Lead Developer", "bio": "<p>Peter builds the technology that powers our service.</p>"}]}', '2024-08-01 10:00:00+00'),
('contact', 'Contact Us', '{"address": "123 Grocery Lane, Foodie City, 12345", "email": "support@karwanbazar.com", "phone": "+1 (555) 123-4567"}', '2024-08-01 10:00:00+00'),
('faq', 'Frequently Asked Questions', '{"faqs": [{"question": "How does the delivery process work?", "answer": "We offer delivery within 90 minutes for most locations..."}, {"question": "What are the payment methods available?", "answer": "We accept all major credit and debit cards..."}]}', '2024-08-01 10:00:00+00'),
('privacy-policy', 'Privacy Policy', '{"html": "<h2>Privacy Policy</h2><p>Your privacy is important to us...</p>"}', '2024-08-01 10:00:00+00'),
('terms-and-conditions', 'Terms and Conditions', '{"html": "<h2>Terms & Conditions</h2><p>By using our service, you agree to these terms...</p>"}', '2024-08-01 10:00:00+00');


-- RLS Policies
drop policy if exists "Enable read access for all users" on "public"."products";
create policy "Enable read access for all users" on "public"."products"
as permissive for select
to public
using (true);

drop policy if exists "Enable read access for all users" on "public"."categories";
create policy "Enable read access for all users" on "public"."categories"
as permissive for select
to public
using (true);

drop policy if exists "Public profiles are viewable by everyone." on "public"."profiles";
create policy "Public profiles are viewable by everyone." on "public"."profiles"
as permissive for select
to public
using (true);

drop policy if exists "Users can insert their own profile." on "public"."profiles";
create policy "Users can insert their own profile." on "public"."profiles"
as permissive for insert
to public
with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on "public"."profiles";
create policy "Users can update own profile." on "public"."profiles"
as permissive for update
to public
using (auth.uid() = id);

drop policy if exists "Enable read access for all users" on "public"."reviews";
create policy "Enable read access for all users" on "public"."reviews"
as permissive for select
to public
using (status = 'Approved');

drop policy if exists "Users can insert their own reviews" on "public"."reviews";
create policy "Users can insert their own reviews" on "public"."reviews"
as permissive for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Admins can manage reviews" on "public"."reviews";
create policy "Admins can manage reviews" on "public"."reviews"
as permissive for all
to public
using (check_if_admin(auth.uid()))
with check (check_if_admin(auth.uid()));

drop policy if exists "Enable read access for all users" on "public"."questions";
create policy "Enable read access for all users" on "public"."questions"
as permissive for select
to public
using (true);

drop policy if exists "Users can insert their own questions" on "public"."questions";
create policy "Users can insert their own questions" on "public"."questions"
as permissive for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Admins can manage questions" on "public"."questions";
create policy "Admins can manage questions" on "public"."questions"
as permissive for all
to public
using (check_if_admin(auth.uid()))
with check (check_if_admin(auth.uid()));

drop policy if exists "Authenticated users can CRUD their own wishlist" on "public"."wishlist";
create policy "Authenticated users can CRUD their own wishlist" on "public"."wishlist"
as permissive for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Enable read for users based on user_id" on "public"."orders";
create policy "Enable read for users based on user_id" on "public"."orders"
as permissive for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Enable all for admins" on "public"."orders";
create policy "Enable all for admins" on "public"."orders"
as permissive for all
to public
using (check_if_admin(auth.uid()))
with check (check_if_admin(auth.uid()));

drop policy if exists "Users can CRUD their own addresses" on "public"."addresses";
create policy "Users can CRUD their own addresses" on "public"."addresses"
as permissive for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Enable read access for all users" on "public"."pages";
create policy "Enable read access for all users" on "public"."pages"
as permissive for select
to public
using (true);

drop policy if exists "Enable read access for all users" on "public"."settings";
create policy "Enable read access for all users" on "public"."settings"
as permissive for select
to public
using (true);

drop policy if exists "Enable all for admins" on "public"."settings";
create policy "Enable all for admins" on "public"."settings"
as permissive for all
to public
using (check_if_admin(auth.uid()))
with check (check_if_admin(auth.uid()));

-- Functions
drop function if exists public.check_if_admin(p_user_id uuid);
create function public.check_if_admin(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = p_user_id and role in ('admin', 'super-admin')
  );
end;
$$;

-- Get admin order details
create or replace function get_admin_order_details(p_order_number text)
returns table (
  id bigint,
  order_number text,
  created_at timestamptz,
  total_amount numeric,
  status order_status,
  shipping_details jsonb,
  profiles jsonb,
  order_items jsonb,
  coupon_code text,
  discount_amount numeric,
  payment_method text,
  transaction_details jsonb
) as $$
begin
  return query
  select
    o.id,
    o.order_number,
    o.created_at,
    o.total_amount,
    o.status,
    o.shipping_details,
    case
      when p.id is not null then jsonb_build_object(
        'full_name', p.full_name,
        'avatar_url', p.avatar_url
      )
      else null
    end as profiles,
    oi_agg.order_items,
    o.coupon_code,
    o.discount_amount,
    o.payment_method,
    o.payment_details as transaction_details
  from orders o
  left join profiles p on o.user_id = p.id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', oi.id,
        'quantity', oi.quantity,
        'price_at_purchase', oi.price,
        'products', case when pr.id is not null then jsonb_build_object('name', pr.name, 'featured_image_url', pr.featured_image_url) else null end
      )
    ) as order_items
    from order_items oi
    left join products pr on oi.product_id = pr.id
    where oi.order_id = o.id
  ) oi_agg on true
  where o.order_number = p_order_number;
end;
$$ language plpgsql security definer;
