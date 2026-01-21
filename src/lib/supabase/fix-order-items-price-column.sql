-- This script adds the missing 'price' column to your 'order_items' table.
-- It is safe to run even if the column already exists.

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS price numeric NOT NULL DEFAULT 0;
