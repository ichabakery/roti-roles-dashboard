
-- Matikan RLS sementara untuk demo testing
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;

-- Hapus semua policy yang ada
DROP POLICY IF EXISTS "Authenticated users can view branches" ON branches;
DROP POLICY IF EXISTS "Authenticated users can create branches" ON branches;
DROP POLICY IF EXISTS "Authenticated users can update branches" ON branches;
DROP POLICY IF EXISTS "Authenticated users can delete branches" ON branches;

-- Verifikasi tidak ada data dummy yang tersisa
DELETE FROM branches WHERE 
  name ILIKE '%test%' OR 
  name ILIKE '%dummy%' OR 
  name ILIKE '%sample%' OR
  name ILIKE '%contoh%' OR 
  name ILIKE '%demo%' OR
  name ILIKE '%kerek%';

-- Grant permission untuk semua user pada tabel branches
GRANT ALL ON branches TO authenticated;
GRANT ALL ON branches TO anon;
