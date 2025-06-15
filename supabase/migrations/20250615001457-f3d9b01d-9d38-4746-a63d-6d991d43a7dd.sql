
-- Tambah kolom untuk mendukung expiry monitoring di level produk
ALTER TABLE public.products 
ADD COLUMN has_expiry BOOLEAN DEFAULT false,
ADD COLUMN default_expiry_days INTEGER DEFAULT NULL;

-- Update existing products to set has_expiry = false by default
UPDATE public.products SET has_expiry = false WHERE has_expiry IS NULL;

-- Tambah constraint untuk memastikan default_expiry_days positif jika ada
ALTER TABLE public.products 
ADD CONSTRAINT check_default_expiry_days_positive 
CHECK (default_expiry_days IS NULL OR default_expiry_days > 0);

-- Tambah comment untuk dokumentasi
COMMENT ON COLUMN public.products.has_expiry IS 'Menentukan apakah produk ini memiliki tanggal kadaluarsa';
COMMENT ON COLUMN public.products.default_expiry_days IS 'Jumlah hari default untuk kadaluarsa dari tanggal produksi';
