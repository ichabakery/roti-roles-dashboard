
-- Add RLS policies for transactions table to fix reports access
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policy for owners to access all transactions
CREATE POLICY "Owner can access all transactions" 
  ON public.transactions 
  FOR ALL 
  USING (public.get_current_user_role() = 'owner')
  WITH CHECK (public.get_current_user_role() = 'owner');

-- Policy for admin_pusat to access all transactions
CREATE POLICY "Admin pusat can access all transactions" 
  ON public.transactions 
  FOR ALL 
  USING (public.get_current_user_role() = 'admin_pusat')
  WITH CHECK (public.get_current_user_role() = 'admin_pusat');

-- Policy for kepala_produksi to view all transactions (for planning purposes)
CREATE POLICY "Kepala produksi can view all transactions" 
  ON public.transactions 
  FOR SELECT 
  USING (public.get_current_user_role() = 'kepala_produksi');

-- Policy for kasir_cabang to only access their branch transactions
CREATE POLICY "Kasir can access their branch transactions" 
  ON public.transactions 
  FOR ALL 
  USING (
    public.get_current_user_role() = 'kasir_cabang' 
    AND branch_id IN (
      SELECT ub.branch_id 
      FROM public.user_branches ub 
      WHERE ub.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.get_current_user_role() = 'kasir_cabang' 
    AND branch_id IN (
      SELECT ub.branch_id 
      FROM public.user_branches ub 
      WHERE ub.user_id = auth.uid()
    )
  );

-- Add RLS policies for transaction_items table
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- Policy for owners to access all transaction items
CREATE POLICY "Owner can access all transaction items" 
  ON public.transaction_items 
  FOR ALL 
  USING (public.get_current_user_role() = 'owner')
  WITH CHECK (public.get_current_user_role() = 'owner');

-- Policy for admin_pusat to access all transaction items
CREATE POLICY "Admin pusat can access all transaction items" 
  ON public.transaction_items 
  FOR ALL 
  USING (public.get_current_user_role() = 'admin_pusat')
  WITH CHECK (public.get_current_user_role() = 'admin_pusat');

-- Policy for kepala_produksi to view all transaction items
CREATE POLICY "Kepala produksi can view all transaction items" 
  ON public.transaction_items 
  FOR SELECT 
  USING (public.get_current_user_role() = 'kepala_produksi');

-- Policy for kasir_cabang to access transaction items from their branch
CREATE POLICY "Kasir can access their branch transaction items" 
  ON public.transaction_items 
  FOR ALL 
  USING (
    public.get_current_user_role() = 'kasir_cabang' 
    AND EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.id = transaction_items.transaction_id 
      AND t.branch_id IN (
        SELECT ub.branch_id 
        FROM public.user_branches ub 
        WHERE ub.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    public.get_current_user_role() = 'kasir_cabang' 
    AND EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.id = transaction_items.transaction_id 
      AND t.branch_id IN (
        SELECT ub.branch_id 
        FROM public.user_branches ub 
        WHERE ub.user_id = auth.uid()
      )
    )
  );

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Add foreign key for transactions.branch_id -> branches.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_transactions_branch_id'
  ) THEN
    ALTER TABLE public.transactions 
    ADD CONSTRAINT fk_transactions_branch_id 
    FOREIGN KEY (branch_id) REFERENCES public.branches(id);
  END IF;

  -- Add foreign key for transactions.cashier_id -> auth.users.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_transactions_cashier_id'
  ) THEN
    ALTER TABLE public.transactions 
    ADD CONSTRAINT fk_transactions_cashier_id 
    FOREIGN KEY (cashier_id) REFERENCES auth.users(id);
  END IF;

  -- Add foreign key for transaction_items.transaction_id -> transactions.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_transaction_items_transaction_id'
  ) THEN
    ALTER TABLE public.transaction_items 
    ADD CONSTRAINT fk_transaction_items_transaction_id 
    FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for transaction_items.product_id -> products.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_transaction_items_product_id'
  ) THEN
    ALTER TABLE public.transaction_items 
    ADD CONSTRAINT fk_transaction_items_product_id 
    FOREIGN KEY (product_id) REFERENCES public.products(id);
  END IF;

  -- Add foreign key for user_branches.user_id -> auth.users.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_branches_user_id'
  ) THEN
    ALTER TABLE public.user_branches 
    ADD CONSTRAINT fk_user_branches_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for user_branches.branch_id -> branches.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_branches_branch_id'
  ) THEN
    ALTER TABLE public.user_branches 
    ADD CONSTRAINT fk_user_branches_branch_id 
    FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_branch_id ON public.transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_cashier_id ON public.transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON public.transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_user_id ON public.user_branches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_branch_id ON public.user_branches(branch_id);
