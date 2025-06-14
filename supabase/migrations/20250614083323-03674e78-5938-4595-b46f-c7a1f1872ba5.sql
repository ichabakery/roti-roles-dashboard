
-- Enable RLS on products table if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view all products
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT
  USING (true);

-- Create policy to allow authenticated users to insert products
CREATE POLICY "Authenticated users can insert products" ON public.products
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy to allow authenticated users to update products
CREATE POLICY "Authenticated users can update products" ON public.products
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Create policy to allow authenticated users to delete products
CREATE POLICY "Authenticated users can delete products" ON public.products
  FOR DELETE
  USING (auth.uid() IS NOT NULL);
