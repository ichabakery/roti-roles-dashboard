
-- Hapus policy lama yang bermasalah
DROP POLICY IF EXISTS "Owner and admin access user branches" ON public.user_branches;
DROP POLICY IF EXISTS "Kasir access their own branches" ON public.user_branches;

-- Enable RLS jika belum diaktifkan
ALTER TABLE public.user_branches ENABLE ROW LEVEL SECURITY;

-- Buat policy baru menggunakan get_current_user_role() function
CREATE POLICY "Owner can manage all user branches" 
  ON public.user_branches 
  FOR ALL 
  USING (public.get_current_user_role() = 'owner')
  WITH CHECK (public.get_current_user_role() = 'owner');

-- Policy untuk kasir melihat branch assignment mereka sendiri
CREATE POLICY "Users can view their own branch assignments" 
  ON public.user_branches 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy untuk admin pusat mengelola user branches
CREATE POLICY "Admin can manage user branches" 
  ON public.user_branches 
  FOR ALL 
  USING (public.get_current_user_role() = 'admin_pusat')
  WITH CHECK (public.get_current_user_role() = 'admin_pusat');
