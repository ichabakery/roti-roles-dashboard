-- =====================================================
-- SYNC PRODUK DARI FILE EXCEL LIST_PRODUK_DAN_HARGA-2
-- =====================================================

-- Hapus duplikat produk (simpan yang pertama berdasarkan created_at)
DELETE FROM products 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(name)) ORDER BY created_at) as rn
    FROM products
  ) t WHERE rn > 1
);

-- Insert produk dari Excel yang belum ada di database
-- PRODUK UTAMA
INSERT INTO products (name, price, category, product_type, active)
SELECT * FROM (VALUES
  ('7 Rasa', 8000, 'produk_utama', 'regular'::product_type, true),
  ('Abon', 2500, 'produk_utama', 'regular'::product_type, true),
  ('Belah', 5500, 'produk_utama', 'regular'::product_type, true),
  ('Bolu Batik Besar', 8000, 'produk_utama', 'regular'::product_type, true),
  ('Bolu Batik Mika', 20000, 'produk_utama', 'regular'::product_type, true),
  ('Bolu Iris', 1500, 'produk_utama', 'regular'::product_type, true),
  ('Bolu Kecil', 3500, 'produk_utama', 'regular'::product_type, true),
  ('Bolu Kukus', 2000, 'produk_utama', 'regular'::product_type, true),
  ('Bolu Pisang 18', 18000, 'produk_utama', 'regular'::product_type, true),
  ('Bolu Pisang Mika', 25000, 'produk_utama', 'regular'::product_type, true),
  ('Bolu Potong Segitiga', 3000, 'produk_utama', 'regular'::product_type, true),
  ('Bolu Potong Persegi', 4000, 'produk_utama', 'regular'::product_type, true),
  ('Bolu Potong Persegi Panjang', 6000, 'produk_utama', 'regular'::product_type, true),
  ('Boy', 6000, 'produk_utama', 'regular'::product_type, true),
  ('Brownies Isi 4', 6000, 'produk_utama', 'regular'::product_type, true),
  ('Brownies Isi 6', 12000, 'produk_utama', 'regular'::product_type, true),
  ('Brownies Isi 8', 17000, 'produk_utama', 'regular'::product_type, true),
  ('Brownies Isi 10', 22000, 'produk_utama', 'regular'::product_type, true),
  ('Brownies Kukus Coklat', 30000, 'produk_utama', 'regular'::product_type, true),
  ('Brownies Kukus Pandan', 28000, 'produk_utama', 'regular'::product_type, true),
  ('Brownies Mini', 4000, 'produk_utama', 'regular'::product_type, true),
  ('Cake Lubang 14', 6500, 'produk_utama', 'regular'::product_type, true),
  ('Cake Lubang 16', 8000, 'produk_utama', 'regular'::product_type, true),
  ('Cake Lubang 18', 12000, 'produk_utama', 'regular'::product_type, true),
  ('Coklat', 2000, 'produk_utama', 'regular'::product_type, true),
  ('Coklat Eret', 3000, 'produk_utama', 'regular'::product_type, true),
  ('Coklat Padat', 5000, 'produk_utama', 'regular'::product_type, true),
  ('Cupcake', 6000, 'produk_utama', 'regular'::product_type, true),
  ('Donat Hias', 3500, 'produk_utama', 'regular'::product_type, true),
  ('Donat Mini Mika Isi 4', 4500, 'produk_utama', 'regular'::product_type, true),
  ('Donat Mini Mika Isi 6', 7000, 'produk_utama', 'regular'::product_type, true),
  ('Donat Mini Mika Isi 8', 10000, 'produk_utama', 'regular'::product_type, true),
  ('Donat Mini Mika Isi 10', 15000, 'produk_utama', 'regular'::product_type, true),
  ('Gulung', 20000, 'produk_utama', 'regular'::product_type, true),
  ('Gulung Iris Jadi 2', 10000, 'produk_utama', 'regular'::product_type, true),
  ('Gulung Iris', 2000, 'produk_utama', 'regular'::product_type, true),
  ('Gulung Mika', 11000, 'produk_utama', 'regular'::product_type, true),
  ('Gulung Toping Mika', 15000, 'produk_utama', 'regular'::product_type, true),
  ('Gulung Kukus Batik', 28000, 'produk_utama', 'regular'::product_type, true),
  ('Gulung Pelangi', 28000, 'produk_utama', 'regular'::product_type, true),
  ('Gulung Toping', 27000, 'produk_utama', 'regular'::product_type, true),
  ('Keju Cetik', 3000, 'produk_utama', 'regular'::product_type, true),
  ('Keju Meses', 5500, 'produk_utama', 'regular'::product_type, true),
  ('Kenong Jumbo', 8500, 'produk_utama', 'regular'::product_type, true),
  ('Kenong Jumbo Isi', 10000, 'produk_utama', 'regular'::product_type, true),
  ('Kepang', 3500, 'produk_utama', 'regular'::product_type, true),
  ('Kura', 2000, 'produk_utama', 'regular'::product_type, true),
  ('Mawar', 6000, 'produk_utama', 'regular'::product_type, true),
  ('Mentega', 2500, 'produk_utama', 'regular'::product_type, true),
  ('Meses', 2500, 'produk_utama', 'regular'::product_type, true),
  ('Minitray', 4000, 'produk_utama', 'regular'::product_type, true),
  ('Milcraps', 13000, 'produk_utama', 'regular'::product_type, true),
  ('Paket Donat Kotak Isi 6', 18000, 'produk_utama', 'regular'::product_type, true),
  ('Panir', 2500, 'produk_utama', 'regular'::product_type, true),
  ('Selimut', 5000, 'produk_utama', 'regular'::product_type, true),
  ('Pia Kacang', 13000, 'produk_utama', 'regular'::product_type, true),
  ('Pisang Mini', 2500, 'produk_utama', 'regular'::product_type, true),
  ('Pizza Mini', 2500, 'produk_utama', 'regular'::product_type, true),
  ('Pizza Bulat', 7000, 'produk_utama', 'regular'::product_type, true),
  ('Roll Mini', 2000, 'produk_utama', 'regular'::product_type, true),
  ('Roll Abon', 3000, 'produk_utama', 'regular'::product_type, true),
  ('Roll Misis', 3000, 'produk_utama', 'regular'::product_type, true),
  ('Roti Bluder Kismis', 3000, 'produk_utama', 'regular'::product_type, true),
  ('Roti Boy Kopi', 6000, 'produk_utama', 'regular'::product_type, true),
  ('Roti Boy Pandan', 6000, 'produk_utama', 'regular'::product_type, true),
  ('Roti Kelapa', 2500, 'produk_utama', 'regular'::product_type, true),
  ('Roti Oreo', 3000, 'produk_utama', 'regular'::product_type, true),
  ('Roti Pisang Besar', 5000, 'produk_utama', 'regular'::product_type, true),
  ('Roti Pisang Kecil', 2500, 'produk_utama', 'regular'::product_type, true),
  ('Roti Tawar', 4500, 'produk_utama', 'regular'::product_type, true),
  ('Salju', 2000, 'produk_utama', 'regular'::product_type, true),
  ('Semangka', 2000, 'produk_utama', 'regular'::product_type, true),
  ('Sisir', 2500, 'produk_utama', 'regular'::product_type, true),
  ('Sisir Jumbo', 10000, 'produk_utama', 'regular'::product_type, true),
  ('Sisir Kecil', 7000, 'produk_utama', 'regular'::product_type, true),
  ('Smile', 5000, 'produk_utama', 'regular'::product_type, true),
  ('Sosis Panjang', 5000, 'produk_utama', 'regular'::product_type, true),
  ('Spiku', 24000, 'produk_utama', 'regular'::product_type, true),
  ('Spiku Iris', 2000, 'produk_utama', 'regular'::product_type, true),
  ('Spiku Iris Jadi 2', 12000, 'produk_utama', 'regular'::product_type, true),
  ('Tawar', 10000, 'produk_utama', 'regular'::product_type, true),
  ('Tawar Bandung', 5500, 'produk_utama', 'regular'::product_type, true),
  ('Wijen', 2000, 'produk_utama', 'regular'::product_type, true),
  ('Zebra', 2000, 'produk_utama', 'regular'::product_type, true),
  ('Marble Cake', 2000, 'produk_utama', 'regular'::product_type, true),
  ('Gulung Isi 3', 75000, 'produk_utama', 'regular'::product_type, true),
  ('Bolu Gulung', 20000, 'produk_utama', 'regular'::product_type, true),
  ('Bolu Gulung Toping', 27000, 'produk_utama', 'regular'::product_type, true),
  ('Pisang Goreng', 2500, 'produk_utama', 'regular'::product_type, true),
  ('Roti Tawar Pandan', 14000, 'produk_utama', 'regular'::product_type, true),
  ('Roti Tawar Coklat', 14000, 'produk_utama', 'regular'::product_type, true)
) AS v(name, price, category, product_type, active)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(v.name))
);

-- MINUMAN
INSERT INTO products (name, price, category, product_type, active)
SELECT * FROM (VALUES
  ('Teh Rio', 1500, 'minuman', 'regular'::product_type, true),
  ('Kopikap', 1500, 'minuman', 'regular'::product_type, true),
  ('Teh Pucuk', 4000, 'minuman', 'regular'::product_type, true),
  ('Milku', 4000, 'minuman', 'regular'::product_type, true),
  ('Teh Javana', 4000, 'minuman', 'regular'::product_type, true),
  ('Es Batu', 1000, 'minuman', 'regular'::product_type, true),
  ('Es Batu Kristal', 7000, 'minuman', 'regular'::product_type, true),
  ('Aqua Gelas', 1000, 'minuman', 'regular'::product_type, true),
  ('Aqua Botol Kecil', 3000, 'minuman', 'regular'::product_type, true),
  ('Ale Ale', 2500, 'minuman', 'regular'::product_type, true),
  ('Floridina', 4000, 'minuman', 'regular'::product_type, true)
) AS v(name, price, category, product_type, active)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(v.name))
);

-- TITIPAN DAN LAINNYA
INSERT INTO products (name, price, category, product_type, active)
SELECT * FROM (VALUES
  ('Bakpia', 1000, 'titipan', 'regular'::product_type, true),
  ('Onde-onde', 1500, 'titipan', 'regular'::product_type, true),
  ('Kue Lapis', 2000, 'titipan', 'regular'::product_type, true),
  ('Pastel', 2500, 'titipan', 'regular'::product_type, true),
  ('Risoles', 2500, 'titipan', 'regular'::product_type, true),
  ('Lumpia', 2500, 'titipan', 'regular'::product_type, true),
  ('Kroket', 2500, 'titipan', 'regular'::product_type, true),
  ('Lemper', 2500, 'titipan', 'regular'::product_type, true)
) AS v(name, price, category, product_type, active)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(v.name))
);

-- PERALATAN
INSERT INTO products (name, price, category, product_type, active)
SELECT * FROM (VALUES
  ('Lilin Spiral 12', 3000, 'peralatan', 'regular'::product_type, true),
  ('Lilin Magic', 5000, 'peralatan', 'regular'::product_type, true),
  ('Lilin Ulir', 3000, 'peralatan', 'regular'::product_type, true),
  ('Lilin Angka', 5000, 'peralatan', 'regular'::product_type, true),
  ('Banner HBD', 3000, 'peralatan', 'regular'::product_type, true),
  ('Hiasan HBD', 5000, 'peralatan', 'regular'::product_type, true),
  ('Topeng', 2000, 'peralatan', 'regular'::product_type, true),
  ('Pisau Tart', 5000, 'peralatan', 'regular'::product_type, true),
  ('Garpu Tart', 3000, 'peralatan', 'regular'::product_type, true),
  ('Pita', 2000, 'peralatan', 'regular'::product_type, true),
  ('Piring Kue', 3000, 'peralatan', 'regular'::product_type, true),
  ('Topi Ultah', 2000, 'peralatan', 'regular'::product_type, true),
  ('Terompet', 2000, 'peralatan', 'regular'::product_type, true),
  ('Balon', 1500, 'peralatan', 'regular'::product_type, true),
  ('Confetti', 3000, 'peralatan', 'regular'::product_type, true)
) AS v(name, price, category, product_type, active)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(v.name))
);

-- KUE TART
INSERT INTO products (name, price, category, product_type, active)
SELECT * FROM (VALUES
  ('Tart 12 Biasa', 65000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 12 CP', 75000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 12 Karakter', 85000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 14 Biasa', 85000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 14 CP', 95000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 14 Karakter', 105000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 16 Biasa', 105000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 16 CP', 115000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 16 Karakter', 125000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 18 Biasa', 125000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 18 CP', 140000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 18 Karakter', 160000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 20 Biasa', 155000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 20 CP', 175000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 20 Karakter', 195000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 22 Biasa', 185000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 22 CP', 210000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 22 Karakter', 235000, 'kue_tart', 'regular'::product_type, true),
  ('Tart Bento Biasa', 35000, 'kue_tart', 'regular'::product_type, true),
  ('Tart Bento Karakter', 45000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 2 Tingkat', 350000, 'kue_tart', 'regular'::product_type, true),
  ('Tart 3 Tingkat', 500000, 'kue_tart', 'regular'::product_type, true),
  ('Tart Custom', 0, 'kue_tart', 'regular'::product_type, true)
) AS v(name, price, category, product_type, active)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(v.name))
);

-- AICE (ES KRIM)
INSERT INTO products (name, price, category, product_type, active)
SELECT * FROM (VALUES
  ('Aice Mochi', 3000, 'es_krim', 'regular'::product_type, true),
  ('Aice Cone', 3000, 'es_krim', 'regular'::product_type, true),
  ('Aice Stick Susu', 2000, 'es_krim', 'regular'::product_type, true),
  ('Aice Stick Coklat', 2000, 'es_krim', 'regular'::product_type, true),
  ('Aice Cup', 2500, 'es_krim', 'regular'::product_type, true),
  ('Aice Semangka', 2000, 'es_krim', 'regular'::product_type, true),
  ('Aice Durian', 2500, 'es_krim', 'regular'::product_type, true),
  ('Aice Melon', 2000, 'es_krim', 'regular'::product_type, true),
  ('Aice Nanas', 2000, 'es_krim', 'regular'::product_type, true),
  ('Aice Strawberry', 2000, 'es_krim', 'regular'::product_type, true)
) AS v(name, price, category, product_type, active)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(v.name))
);