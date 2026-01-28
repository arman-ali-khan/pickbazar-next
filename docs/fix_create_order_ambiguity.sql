-- This script removes the conflicting version of the create_order function
-- that was causing "Could not choose the best candidate function" errors.

DROP FUNCTION IF EXISTS public.create_order(numeric, jsonb, jsonb, text, jsonb, text, numeric, public.order_status);
