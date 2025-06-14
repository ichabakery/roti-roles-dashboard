
-- Hapus semua data dummy dari tabel branches
DELETE FROM branches WHERE 
  name ILIKE '%test%' OR 
  name ILIKE '%dummy%' OR 
  name ILIKE '%sample%' OR
  name ILIKE '%contoh%' OR
  name ILIKE '%demo%' OR
  address ILIKE '%test%' OR
  address ILIKE '%dummy%' OR
  address ILIKE '%sample%' OR
  address ILIKE '%contoh%' OR
  address ILIKE '%demo%';

-- Tampilkan data yang tersisa setelah penghapusan
SELECT id, name, address, phone, created_at FROM branches ORDER BY created_at;
