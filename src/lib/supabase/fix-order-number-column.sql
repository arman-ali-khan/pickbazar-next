-- This script adds the missing 'order_number' column to your existing 'orders' table.
-- It is safe to run and will not affect your existing data.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;
