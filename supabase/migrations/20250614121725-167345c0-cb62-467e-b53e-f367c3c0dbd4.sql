
-- Hapus semua RLS policies yang bermasalah dari tabel inventory
DROP POLICY IF EXISTS "Owner and admin can view all inventory" ON public.inventory;
DROP POLICY IF EXISTS "Kasir can view their branch inventory" ON public.inventory;
DROP POLICY IF EXISTS "Production head can view all inventory" ON public.inventory;
DROP POLICY IF EXISTS "Owner and admin can manage inventory" ON public.inventory;
DROP POLICY IF EXISTS "Kasir can update their branch inventory" ON public.inventory;
DROP POLICY IF EXISTS "Kasir can insert their branch inventory" ON public.inventory;

-- Buat RLS policies baru yang lebih sederhana dan tidak mengakses auth.users
-- Policy untuk owner dan admin berdasarkan email pattern
CREATE POLICY "Owner and admin access all inventory" 
  ON public.inventory 
  FOR ALL 
  USING (
    (SELECT auth.jwt() ->> 'email') IN (
      'owner@bakeryguru.com', 
      'owner@icha.com', 
      'admin@bakeryguru.com',
      'produksi@bakeryguru.com'
    )
  );

-- Policy untuk kasir berdasarkan user_branches dan email pattern
CREATE POLICY "Kasir access their branch inventory" 
  ON public.inventory 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_branches ub
      WHERE ub.user_id = auth.uid() 
      AND ub.branch_id = inventory.branch_id
      AND (SELECT auth.jwt() ->> 'email') LIKE '%kasir%'
    )
  );

-- Policy fallback untuk akses yang sah
CREATE POLICY "Authenticated users basic access" 
  ON public.inventory 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);
