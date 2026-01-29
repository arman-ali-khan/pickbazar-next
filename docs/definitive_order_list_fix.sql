-- Drop the old, incorrect function to avoid conflicts.
DROP FUNCTION IF EXISTS public.get_admin_order_list();

-- Create the new, corrected function.
-- This version ensures the returned columns and their types exactly match
-- what the application expects, resolving the "structure of query does not match" error.
CREATE OR REPLACE FUNCTION public.get_admin_order_list()
RETURNS TABLE(
    id bigint,
    order_number text,
    created_at timestamptz,
    total_amount numeric,
    status public.order_status,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This function must be run by a user with permissions to bypass RLS.
    -- The SECURITY DEFINER clause allows this function to access tables on behalf of the function owner.
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        p.full_name AS customer_name,
        o.shipping_details->>'email' AS customer_email,
        p.avatar_url AS customer_avatar_url
    FROM
        orders AS o
    LEFT JOIN
        profiles AS p ON o.user_id = p.id
    ORDER BY
        o.created_at DESC;
END;
$$;

-- Grant execution permission to the 'service_role' to be able to set SECURITY DEFINER
-- and to 'authenticated' users to be able to call it.
GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_order_list() TO service_role;
