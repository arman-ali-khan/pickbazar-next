-- This script removes a conflicting version of the create_order function.
-- The conflict arises from having two functions with the same name but different
-- argument types for amounts (numeric vs double precision). This script
-- removes the older, incorrect version that uses `numeric`.
DROP FUNCTION IF EXISTS public.create_order(p_total_amount numeric, p_shipping_details jsonb, p_items jsonb, p_payment_method text, p_transaction_details jsonb, p_coupon_code text, p_discount_amount numeric, p_initial_status public.order_status);
