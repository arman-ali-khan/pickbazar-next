create or replace function get_admin_orders()
returns table (
    id int,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status order_status,
    shipping_details jsonb,
    customer_avatar_url text
) as $$
begin
    return query
    select
        o.id, -- Use alias to resolve ambiguity
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        o.shipping_details,
        p.avatar_url
    from
        orders as o
    left join
        profiles as p on o.user_id = p.id
    order by
        o.created_at desc;
end;
$$ language plpgsql security definer;
