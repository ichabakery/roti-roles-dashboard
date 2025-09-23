-- Fix RLS policy for stock_movements to prevent infinite recursion
-- First, create a security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Direct role lookup from profiles table for the current user
  RETURN (
    SELECT role 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Update existing functions to use proper search_path for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix stock_movements RLS policy to use the security definer function
DROP POLICY IF EXISTS "Users can view stock movements based on role" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can insert stock movements based on role" ON public.stock_movements;

-- Create new RLS policies using the security definer function
CREATE POLICY "Users can view stock movements based on role" ON public.stock_movements
FOR SELECT USING (
  public.get_current_user_role() IN ('owner', 'admin_pusat', 'kepala_produksi') 
  OR (public.get_current_user_role() = 'kasir_cabang' AND branch_id = (
    SELECT branch_id FROM public.profiles WHERE id = auth.uid()
  ))
);

CREATE POLICY "Users can insert stock movements based on role" ON public.stock_movements
FOR INSERT WITH CHECK (
  public.get_current_user_role() IN ('owner', 'admin_pusat', 'kepala_produksi', 'kasir_cabang')
  AND (
    public.get_current_user_role() IN ('owner', 'admin_pusat', 'kepala_produksi')
    OR (public.get_current_user_role() = 'kasir_cabang' AND branch_id = (
      SELECT branch_id FROM public.profiles WHERE id = auth.uid()
    ))
  )
);