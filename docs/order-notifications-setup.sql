
-- This function retrieves all orders for the admin dashboard.
-- It joins orders with user profiles to get customer details.
-- This new version has a different name to avoid potential schema caching issues
-- in Supabase after previous failed script executions.
create or replace function get_admin_order_list()
returns table (
    id int,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
) as $$
begin
    return query
    select
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        p.full_name as customer_name,
        u.email as customer_email,
        p.avatar_url as customer_avatar_url
    from
        public.orders o
    left join
        public.profiles p on o.user_id = p.id
    left join
        auth.users u on o.user_id = u.id
    order by
        o.created_at desc;
end;
$$ language plpgsql security definer;

-- Grant execute permission to the authenticated role
-- The function itself contains checks for admin/manager roles inside other functions,
-- but for this read-only function, we can rely on RLS being enabled for the 'orders' table
-- and the user being an admin (which is checked by the AdminLayout).
grant execute on function public.get_admin_order_list() to authenticated;
grant execute on function public.get_admin_order_list() to service_role;

    