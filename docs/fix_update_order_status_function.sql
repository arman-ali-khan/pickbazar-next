-- This script creates a function to update an order's status and log the change in the order_history table.
-- It returns the updated order details.

-- Drop the old function if it exists to avoid conflicts.
DROP FUNCTION IF EXISTS public.update_order_status_and_log(integer, public.order_status);
DROP FUNCTION IF EXISTS public.update_order_status_and_log_v2(integer, public.order_status);


CREATE OR REPLACE FUNCTION public.update_order_status_and_log_v2(p_order_id integer, p_new_status public.order_status)
RETURNS SETOF orders -- Returns a set of rows with the structure of the 'orders' table.
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update the status of the specified order.
    UPDATE public.orders
    SET status = p_new_status
    WHERE public.orders.id = p_order_id;

    -- Record the status change in the order_history table.
    INSERT INTO public.order_history (order_id, status)
    VALUES (p_order_id, p_new_status);

    -- Return the complete, updated order row.
    RETURN QUERY
    SELECT *
    FROM public.orders
    WHERE public.orders.id = p_order_id;
END;
$$;
