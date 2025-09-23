-- Fix admin@icha.com profile role and branch assignments
-- First, find and update the user's role to admin_pusat
UPDATE public.profiles 
SET role = 'admin_pusat', updated_at = now()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@icha.com'
);

-- Remove any existing branch assignments for this user since admin_pusat doesn't need them
DELETE FROM public.user_branches 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@icha.com'
);

-- Verify the update with a comment for logging
-- The user admin@icha.com should now have role 'admin_pusat' with no branch assignments