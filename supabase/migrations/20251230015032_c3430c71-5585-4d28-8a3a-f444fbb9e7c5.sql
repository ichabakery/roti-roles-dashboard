-- Add discount_amount column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.transactions.discount_amount IS 'Discount amount applied to the transaction';