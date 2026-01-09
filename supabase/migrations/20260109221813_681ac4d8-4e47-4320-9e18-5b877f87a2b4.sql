-- STEP 2: Add tracking_status column and update constraints

-- Add tracking_status column if not exists
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_status TEXT DEFAULT 'in_production';

-- Drop existing status check constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Update existing order statuses to new simplified status
UPDATE public.orders 
SET status = 'new' 
WHERE status IN ('pending', 'confirmed', 'in_production', 'ready');

-- Add new status constraint with only 3 values
ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('new', 'completed', 'cancelled'));

-- Drop and re-add tracking_status constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_tracking_status_check;
ALTER TABLE public.orders
ADD CONSTRAINT orders_tracking_status_check 
CHECK (tracking_status IS NULL OR tracking_status IN ('in_production', 'ready_to_ship', 'in_transit', 'arrived_at_store', 'delivered'));

-- Set tracking_status based on current status for existing orders
UPDATE public.orders 
SET tracking_status = CASE 
  WHEN status = 'completed' THEN 'delivered'
  WHEN status = 'cancelled' THEN NULL
  ELSE 'in_production'
END;