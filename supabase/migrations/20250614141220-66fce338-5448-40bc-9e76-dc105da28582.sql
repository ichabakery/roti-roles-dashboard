
-- Pastikan user owner@icha.com memiliki role 'owner' yang benar
INSERT INTO public.profiles (id, name, role)
SELECT 
  au.id,
  'Owner Icha Bakery',
  'owner'
FROM auth.users au
WHERE au.email = 'owner@icha.com'
ON CONFLICT (id) 
DO UPDATE SET 
  name = 'Owner Icha Bakery',
  role = 'owner',
  updated_at = NOW();

-- Verifikasi data profile untuk owner
SELECT p.id, p.name, p.role, au.email 
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'owner@icha.com';
