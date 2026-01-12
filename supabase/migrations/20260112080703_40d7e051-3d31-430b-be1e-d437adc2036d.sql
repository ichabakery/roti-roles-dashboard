-- Update constraint profiles_role_check untuk menerima role 'kurir'
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('owner', 'admin_pusat', 'kepala_produksi', 'kasir_cabang', 'kurir'));