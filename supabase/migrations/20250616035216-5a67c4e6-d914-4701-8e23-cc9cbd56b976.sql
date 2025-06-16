
-- Add payment status enum
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'partial', 'cancelled');

-- Add new columns to transactions table for deferred payments
ALTER TABLE public.transactions 
ADD COLUMN payment_status payment_status DEFAULT 'paid',
ADD COLUMN amount_paid NUMERIC DEFAULT NULL,
ADD COLUMN amount_remaining NUMERIC DEFAULT NULL,
ADD COLUMN due_date DATE DEFAULT NULL,
ADD COLUMN installment_plan JSONB DEFAULT NULL;

-- Update existing transactions to have 'paid' status
UPDATE public.transactions SET payment_status = 'paid' WHERE payment_status IS NULL;

-- Create table for payment history to track partial payments
CREATE TABLE public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  amount_paid NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cashier_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on payment_history
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_history
CREATE POLICY "Users can view payment history for their branch transactions" 
  ON public.payment_history 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.id = payment_history.transaction_id 
      AND (
        -- Kasir cabang: only their branch transactions
        CASE 
          WHEN auth.jwt() ->> 'email' LIKE '%kasir%' THEN
            EXISTS (
              SELECT 1 FROM public.user_branches ub 
              WHERE ub.user_id = auth.uid() 
              AND ub.branch_id = t.branch_id
            )
          ELSE 
            -- Owner, admin_pusat: all transactions
            true
        END
      )
    )
  );

CREATE POLICY "Users can create payment history for their transactions" 
  ON public.payment_history 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.id = payment_history.transaction_id 
      AND t.cashier_id = auth.uid()
    )
  );

-- Create function to update transaction payment status
CREATE OR REPLACE FUNCTION public.update_transaction_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update transaction totals when payment is made
  UPDATE public.transactions 
  SET 
    amount_paid = COALESCE(amount_paid, 0) + NEW.amount_paid,
    amount_remaining = CASE 
      WHEN COALESCE(amount_paid, 0) + NEW.amount_paid >= total_amount THEN 0
      ELSE total_amount - (COALESCE(amount_paid, 0) + NEW.amount_paid)
    END,
    payment_status = CASE 
      WHEN COALESCE(amount_paid, 0) + NEW.amount_paid >= total_amount THEN 'paid'::payment_status
      WHEN COALESCE(amount_paid, 0) + NEW.amount_paid > 0 THEN 'partial'::payment_status
      ELSE payment_status
    END
  WHERE id = NEW.transaction_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payment history
CREATE TRIGGER update_payment_status_trigger
  AFTER INSERT ON public.payment_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transaction_payment_status();
