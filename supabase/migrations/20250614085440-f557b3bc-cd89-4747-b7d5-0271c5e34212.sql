
-- Hapus policy yang sudah ada terlebih dahulu
DROP POLICY IF EXISTS "Everyone can view branches" ON branches;
DROP POLICY IF EXISTS "Only owner and admin can create branches" ON branches;
DROP POLICY IF EXISTS "Only owner and admin can update branches" ON branches;
DROP POLICY IF EXISTS "Only owner and admin can delete branches" ON branches;

-- Enable RLS untuk tabel branches jika belum aktif
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Buat policy untuk SELECT - semua authenticated user bisa melihat cabang
CREATE POLICY "Everyone can view branches" ON branches
  FOR SELECT USING (true);

-- Buat policy untuk INSERT - hanya owner dan admin_pusat yang bisa menambah cabang
CREATE POLICY "Only owner and admin can create branches" ON branches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.raw_user_meta_data->>'role' = 'owner' OR
        auth.users.raw_user_meta_data->>'role' = 'admin_pusat'
      )
    )
  );

-- Buat policy untuk UPDATE - hanya owner dan admin_pusat yang bisa edit cabang
CREATE POLICY "Only owner and admin can update branches" ON branches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.raw_user_meta_data->>'role' = 'owner' OR
        auth.users.raw_user_meta_data->>'role' = 'admin_pusat'
      )
    )
  );

-- Buat policy untuk DELETE - hanya owner dan admin_pusat yang bisa hapus cabang
CREATE POLICY "Only owner and admin can delete branches" ON branches
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.raw_user_meta_data->>'role' = 'owner' OR
        auth.users.raw_user_meta_data->>'role' = 'admin_pusat'
      )
    )
  );

-- Hapus data dummy jika ada
DELETE FROM branches WHERE name LIKE '%Test%' OR name LIKE '%Dummy%' OR name LIKE '%Sample%';
