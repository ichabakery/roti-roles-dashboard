-- Add policy for admin_pusat to view all profiles (for reports)
CREATE POLICY "Admin pusat can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin_pusat');
