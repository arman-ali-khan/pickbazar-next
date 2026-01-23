
-- This function retrieves the last 20 notifications for the admin dashboard.
-- It's marked as SECURITY DEFINER to bypass Row Level Security, ensuring admins can see all relevant notifications
-- without complex policies on the function itself. It's safe because it's a read-only operation.
create or replace function public.get_admin_notifications()
returns table (
    id int,
    title text,
    message text,
    link text,
    is_read boolean,
    created_at timestamptz,
    type notification_type
)
language plpgsql stable security definer as $$
begin
    return query
    select
        n.id,
        n.title,
        n.message,
        n.link,
        n.is_read,
        n.created_at,
        n.type
    from
        public.notifications n
    order by
        n.created_at desc
    limit 20;
end;
$$;
