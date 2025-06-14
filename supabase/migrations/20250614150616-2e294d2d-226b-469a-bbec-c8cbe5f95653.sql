
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can delete profiles" ON public.profiles;

-- Create new policies with correct syntax
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Owners can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (public.get_current_user_role() = 'owner');

CREATE POLICY "Owners can insert profiles" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (public.get_current_user_role() = 'owner');

CREATE POLICY "Owners can update profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (public.get_current_user_role() = 'owner');

CREATE POLICY "Owners can delete profiles" 
  ON public.profiles 
  FOR DELETE 
  USING (public.get_current_user_role() = 'owner' AND role != 'owner');
