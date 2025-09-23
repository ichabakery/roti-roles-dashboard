-- Add nullable inventory fields to products table (additive only)
-- All new fields are nullable with safe defaults

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sku TEXT NULL,
ADD COLUMN IF NOT EXISTS uom TEXT NULL DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS reorder_point INTEGER NULL,
ADD COLUMN IF NOT EXISTS lead_time_days INTEGER NULL,
ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER NULL,
ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC NULL;

-- Create unique constraint on SKU (excluding NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique 
ON public.products (sku) 
WHERE sku IS NOT NULL;

-- Create function to auto-generate SKU when needed
CREATE OR REPLACE FUNCTION public.generate_sku()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate SKU if not provided
    IF NEW.sku IS NULL OR NEW.sku = '' THEN
        -- Use product ID suffix for uniqueness
        NEW.sku := 'PRD-' || SUBSTRING(NEW.id::text FROM 1 FOR 8);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating SKU
DROP TRIGGER IF EXISTS trigger_generate_sku ON public.products;
CREATE TRIGGER trigger_generate_sku
    BEFORE INSERT ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_sku();