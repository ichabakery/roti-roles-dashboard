-- Add additional pickup locations as special branches
INSERT INTO public.branches (id, name, address, phone) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Kantor Admin Pusat', 'Alamat Admin Pusat', 'Telepon Admin Pusat'),
  ('22222222-2222-2222-2222-222222222222', 'Kantor Manajemen Pusat', 'Alamat Manajemen Pusat', 'Telepon Manajemen')
ON CONFLICT (id) DO NOTHING;

-- Add a column to distinguish pickup location types
ALTER TABLE public.branches 
ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'branch';

-- Update the new locations to have proper types
UPDATE public.branches 
SET location_type = 'admin_office' 
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.branches 
SET location_type = 'management_office' 
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Update existing branches to have proper type
UPDATE public.branches 
SET location_type = 'branch' 
WHERE location_type IS NULL;