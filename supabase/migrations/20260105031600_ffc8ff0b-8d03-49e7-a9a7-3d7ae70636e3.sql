-- Create product_categories table for dynamic category management
CREATE TABLE public.product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Insert default categories from existing hardcoded values
INSERT INTO public.product_categories (value, label, display_order, is_default) VALUES
  ('produk_utama', 'Produk Utama', 1, true),
  ('minuman', 'Minuman', 2, false),
  ('titipan', 'Titipan', 3, false),
  ('peralatan', 'Peralatan', 4, false),
  ('kue_tart', 'Kue Tart', 5, false),
  ('es_krim', 'AICE', 6, false);

-- Enable Row Level Security
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active categories
CREATE POLICY "Anyone can view active categories" 
ON public.product_categories 
FOR SELECT 
USING (active = true);

-- Policy: Owner and admin can manage categories (insert, update, delete)
CREATE POLICY "Owner and admin can manage categories" 
ON public.product_categories 
FOR ALL 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('owner', 'admin_pusat')
);

-- Create index for faster ordering
CREATE INDEX idx_product_categories_display_order ON public.product_categories(display_order);