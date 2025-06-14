
-- Enable RLS for inventory table
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Policy for owner and admin_pusat to view all inventory
CREATE POLICY "Owner and admin can view all inventory" 
  ON public.inventory 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        'owner@bakeryguru.com', 
        'owner@icha.com', 
        'admin@bakeryguru.com'
      )
    )
  );

-- Policy for kasir_cabang to view only their branch inventory
CREATE POLICY "Kasir can view their branch inventory" 
  ON public.inventory 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_branches ub
      JOIN auth.users au ON au.id = auth.uid()
      WHERE ub.user_id = auth.uid() 
      AND ub.branch_id = inventory.branch_id
      AND au.email LIKE '%kasir%'
    )
  );

-- Policy for kepala_produksi to view all inventory
CREATE POLICY "Production head can view all inventory" 
  ON public.inventory 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'produksi@bakeryguru.com'
    )
  );

-- Policy for owner and admin_pusat to insert/update inventory
CREATE POLICY "Owner and admin can manage inventory" 
  ON public.inventory 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        'owner@bakeryguru.com', 
        'owner@icha.com', 
        'admin@bakeryguru.com'
      )
    )
  );

-- Policy for kasir_cabang to update only their branch inventory
CREATE POLICY "Kasir can update their branch inventory" 
  ON public.inventory 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_branches ub
      JOIN auth.users au ON au.id = auth.uid()
      WHERE ub.user_id = auth.uid() 
      AND ub.branch_id = inventory.branch_id
      AND au.email LIKE '%kasir%'
    )
  );

-- Policy for kasir_cabang to insert only their branch inventory
CREATE POLICY "Kasir can insert their branch inventory" 
  ON public.inventory 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_branches ub
      JOIN auth.users au ON au.id = auth.uid()
      WHERE ub.user_id = auth.uid() 
      AND ub.branch_id = inventory.branch_id
      AND au.email LIKE '%kasir%'
    )
  );
