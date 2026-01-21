-- This script adds the 'shipping_details' column to the 'orders' table if it doesn't exist.
-- This is a safe operation that will not affect existing data.

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_details jsonb;
