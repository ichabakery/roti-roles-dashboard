-- Add Simple Inventory V1 columns to products table (additive, nullable)
-- These columns enable simple inventory management without breaking existing functionality

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sku text,
ADD COLUMN IF NOT EXISTS uom text DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS reorder_point integer,
ADD COLUMN IF NOT EXISTS lead_time_days integer,
ADD COLUMN IF NOT EXISTS shelf_life_days integer,
ADD COLUMN IF NOT EXISTS cost_per_unit numeric;

-- Create unique index on SKU (allowing nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique 
ON public.products (sku) WHERE sku IS NOT NULL;

-- Add stock adjustment types for inventory tracking
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_adjustment_type') THEN
        CREATE TYPE stock_adjustment_type AS ENUM ('init', 'adjust_in', 'adjust_out', 'production', 'return', 'transfer_in', 'transfer_out', 'sale');
    END IF;
END
$$;

-- Create stock_adjustments table for tracking inventory movements
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    adjustment_type stock_adjustment_type NOT NULL,
    quantity_change integer NOT NULL,
    reason text,
    reference_id uuid,
    reference_type text,
    performed_by uuid REFERENCES auth.users(id),
    adjustment_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- RLS policies for stock_adjustments
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view stock adjustments for their branch"
ON public.stock_adjustments FOR SELECT
USING (
    CASE
        WHEN get_current_user_role() = 'owner' THEN true
        WHEN get_current_user_role() = 'admin_pusat' THEN true
        WHEN get_current_user_role() = 'kepala_produksi' THEN true
        WHEN get_current_user_role() = 'kasir_cabang' THEN 
            branch_id IN (SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid())
        ELSE false
    END
);

CREATE POLICY IF NOT EXISTS "Users can create stock adjustments for their branch"
ON public.stock_adjustments FOR INSERT
WITH CHECK (
    CASE
        WHEN get_current_user_role() = 'owner' THEN true
        WHEN get_current_user_role() = 'admin_pusat' THEN true
        WHEN get_current_user_role() = 'kepala_produksi' THEN true
        WHEN get_current_user_role() = 'kasir_cabang' THEN 
            branch_id IN (SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid())
        ELSE false
    END
);

-- Function to generate SKU if not provided
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

-- Create trigger for SKU generation
DROP TRIGGER IF EXISTS trigger_generate_sku ON public.products;
CREATE TRIGGER trigger_generate_sku
    BEFORE INSERT ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_sku();

-- Function to handle initial stock creation
CREATE OR REPLACE FUNCTION public.create_initial_stock(
    p_product_id uuid,
    p_branch_id uuid,
    p_initial_stock integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only create if initial stock > 0
    IF p_initial_stock > 0 THEN
        -- Create stock adjustment record
        INSERT INTO public.stock_adjustments (
            product_id,
            branch_id,
            adjustment_type,
            quantity_change,
            reason,
            performed_by
        ) VALUES (
            p_product_id,
            p_branch_id,
            'init',
            p_initial_stock,
            'Inisialisasi stok produk',
            auth.uid()
        );
        
        -- Update inventory table
        INSERT INTO public.inventory (product_id, branch_id, quantity, last_updated)
        VALUES (p_product_id, p_branch_id, p_initial_stock, now())
        ON CONFLICT (product_id, branch_id)
        DO UPDATE SET 
            quantity = inventory.quantity + p_initial_stock,
            last_updated = now();
    END IF;
END;
$$;

COMMENT ON COLUMN public.products.sku IS 'Stock Keeping Unit - auto-generated if empty';
COMMENT ON COLUMN public.products.uom IS 'Unit of Measure (pcs, box, pak)';
COMMENT ON COLUMN public.products.reorder_point IS 'Minimum stock level before reorder needed';
COMMENT ON COLUMN public.products.lead_time_days IS 'Days needed to restock';
COMMENT ON COLUMN public.products.shelf_life_days IS 'Product shelf life in days';
COMMENT ON COLUMN public.products.cost_per_unit IS 'Cost per unit for inventory valuation';