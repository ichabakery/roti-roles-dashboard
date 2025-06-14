
-- Drop existing policies yang bermasalah
DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner can delete profiles" ON public.profiles;

-- Buat security definer function untuk mengecek role user
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Buat ulang policies dengan security definer function
CREATE POLICY "Owner can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (public.get_current_user_role() = 'owner');

CREATE POLICY "Owner can insert profiles" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (public.get_current_user_role() = 'owner');

CREATE POLICY "Owner can update profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (public.get_current_user_role() = 'owner');

CREATE POLICY "Owner can delete profiles" 
  ON public.profiles 
  FOR DELETE 
  USING (public.get_current_user_role() = 'owner' AND role != 'owner');
