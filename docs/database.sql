-- Resolve ambiguity for update_order_status_and_log by dropping conflicting versions.
-- Note: The conflicting functions are dropped, and then the correct one is created.
DROP FUNCTION IF EXISTS public.update_order_status_and_log(bigint, public.order_status);
DROP FUNCTION IF EXISTS public.update_order_status_and_log(integer, text);

-- This is the single, correct function for updating order status.
-- It accepts a BIGINT for the order ID and TEXT for the status.
CREATE OR REPLACE FUNCTION public.update_order_status_and_log(p_order_id bigint, p_new_status text)
RETURNS SETOF public.orders AS $$
BEGIN
    UPDATE public.orders
    SET status = p_new_status::public.order_status
    WHERE id = p_order_id;

    RETURN QUERY SELECT * FROM public.orders WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;
