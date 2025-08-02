-- Update orders table to support enhanced order features
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS pickup_branch_id UUID REFERENCES public.branches(id),
ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'cash_on_delivery' CHECK (payment_type IN ('cash_on_delivery', 'dp', 'full_payment')),
ADD COLUMN IF NOT EXISTS dp_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Update existing orders to have payment_type
UPDATE public.orders SET payment_type = 'cash_on_delivery' WHERE payment_type IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_pickup_branch ON public.orders(pickup_branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_type ON public.orders(payment_type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders(delivery_date);

-- Update remaining_amount calculation
UPDATE public.orders 
SET remaining_amount = CASE 
  WHEN payment_type = 'full_payment' THEN 0
  WHEN payment_type = 'dp' THEN total_amount - COALESCE(dp_amount, 0)
  ELSE total_amount
END
WHERE remaining_amount IS NULL OR remaining_amount = 0;