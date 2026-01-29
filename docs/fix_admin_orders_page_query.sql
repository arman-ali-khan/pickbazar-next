-- This function retrieves a list of all orders with customer details for the admin dashboard.
-- It ensures that the returned data structure matches exactly what the frontend code expects,
-- resolving the "structure of query does not match function result type" error.

-- Drop the old, incorrect function if it exists to prevent conflicts.
DROP FUNCTION IF EXISTS get_admin_order_list();

-- Create the new, corrected function.
-- The SECURITY DEFINER clause is crucial for allowing this function to access user data
-- from the auth.users table securely.
CREATE OR REPLACE FUNCTION get_admin_order_list()
RETURNS TABLE (
    id bigint,
    order_number text,
    created_at timestamp with time zone,
    total_amount numeric,
    status text,
    customer_name text,
    customer_email text,
    customer_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        p.full_name,
        u.email,
        p.avatar_url
    FROM
        orders AS o
    LEFT JOIN
        auth.users AS u ON o.user_id = u.id
    LEFT JOIN
        profiles AS p ON o.user_id = p.id
    ORDER BY
        o.created_at DESC;
END;
$$;

-- Grant execution rights to the authenticated role, allowing logged-in users (like admins) to run this function.
GRANT EXECUTE ON FUNCTION get_admin_order_list() TO authenticated;
