
-- Enable RLS on transactions table if not already enabled
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert transactions
-- for branches they have access to
CREATE POLICY "Users can create transactions for their branches" 
  ON public.transactions 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- For kasir_cabang: only allow transactions for their assigned branches
    CASE 
      WHEN auth.jwt() ->> 'email' LIKE '%kasir%' THEN
        EXISTS (
          SELECT 1 FROM public.user_branches ub 
          WHERE ub.user_id = auth.uid() 
          AND ub.branch_id = transactions.branch_id
        )
      ELSE 
        -- For owner, admin_pusat: allow transactions for any branch
        true
    END
    AND cashier_id = auth.uid()
  );

-- Create policy to allow users to view transactions
CREATE POLICY "Users can view transactions for their branches" 
  ON public.transactions 
  FOR SELECT 
  TO authenticated
  USING (
    -- For kasir_cabang: only show transactions for their assigned branches
    CASE 
      WHEN auth.jwt() ->> 'email' LIKE '%kasir%' THEN
        EXISTS (
          SELECT 1 FROM public.user_branches ub 
          WHERE ub.user_id = auth.uid() 
          AND ub.branch_id = transactions.branch_id
        )
      ELSE 
        -- For owner, admin_pusat: show all transactions
        true
    END
  );

-- Enable RLS on transaction_items table if not already enabled
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- Create policy for transaction_items
CREATE POLICY "Users can manage transaction items for their transactions" 
  ON public.transaction_items 
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.id = transaction_items.transaction_id 
      AND t.cashier_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.id = transaction_items.transaction_id 
      AND t.cashier_id = auth.uid()
    )
  );
