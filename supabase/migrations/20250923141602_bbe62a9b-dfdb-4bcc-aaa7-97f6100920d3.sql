-- Fix branches table RLS policies to allow admin to create branches

-- Drop all existing policies on branches table
DROP POLICY IF EXISTS "All authenticated users can view branches" ON public.branches;
DROP POLICY IF EXISTS "Everyone can view branches" ON public.branches;
DROP POLICY IF EXISTS "Only owner and admin can create branches" ON public.branches;
DROP POLICY IF EXISTS "Only owner and admin can delete branches" ON public.branches;
DROP POLICY IF EXISTS "Only owner and admin can insert branches" ON public.branches;
DROP POLICY IF EXISTS "Only owner and admin can update branches" ON public.branches;
DROP POLICY IF EXISTS "Only owner can delete branches" ON public.branches;

-- Create clean and consistent RLS policies for branches table
-- Allow everyone to view branches
CREATE POLICY "Everyone can view branches" 
ON public.branches 
FOR SELECT 
USING (true);

-- Allow owner and admin to insert branches
CREATE POLICY "Owner and admin can insert branches" 
ON public.branches 
FOR INSERT 
WITH CHECK (get_current_user_role() IN ('owner', 'admin_pusat'));

-- Allow owner and admin to update branches
CREATE POLICY "Owner and admin can update branches" 
ON public.branches 
FOR UPDATE 
USING (get_current_user_role() IN ('owner', 'admin_pusat'));

-- Allow only owner to delete branches
CREATE POLICY "Only owner can delete branches" 
ON public.branches 
FOR DELETE 
USING (get_current_user_role() = 'owner');