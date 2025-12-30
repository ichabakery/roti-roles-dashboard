-- Add shipping_cost column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0;

-- Update existing orders to have shipping_cost = 0
UPDATE public.orders SET shipping_cost = 0 WHERE shipping_cost IS NULL;