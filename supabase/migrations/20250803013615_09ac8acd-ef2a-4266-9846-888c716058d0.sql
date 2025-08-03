-- Enable RLS on tables that need it
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stock_movements
CREATE POLICY "Users can view stock movements for their branch" 
ON public.stock_movements 
FOR SELECT 
USING (
  CASE
    WHEN get_current_user_role() = 'owner' THEN true
    WHEN get_current_user_role() = 'admin_pusat' THEN true
    WHEN get_current_user_role() = 'kepala_produksi' THEN true
    WHEN get_current_user_role() = 'kasir_cabang' THEN (
      branch_id IN (
        SELECT ub.branch_id 
        FROM user_branches ub 
        WHERE ub.user_id = auth.uid()
      )
    )
    ELSE false
  END
);

CREATE POLICY "Only admin and kepala_produksi can insert stock movements" 
ON public.stock_movements 
FOR INSERT 
WITH CHECK (get_current_user_role() IN ('owner', 'admin_pusat', 'kepala_produksi'));

-- Create RLS policies for return_items
CREATE POLICY "Users can view return items for their branch" 
ON public.return_items 
FOR SELECT 
USING (
  return_id IN (
    SELECT r.id FROM returns r 
    WHERE 
      CASE
        WHEN get_current_user_role() = 'owner' THEN true
        WHEN get_current_user_role() = 'admin_pusat' THEN true
        WHEN get_current_user_role() = 'kasir_cabang' THEN (
          r.branch_id IN (
            SELECT ub.branch_id 
            FROM user_branches ub 
            WHERE ub.user_id = auth.uid()
          )
        )
        ELSE false
      END
  )
);

CREATE POLICY "Users can manage return items for their branch" 
ON public.return_items 
FOR ALL 
USING (
  return_id IN (
    SELECT r.id FROM returns r 
    WHERE 
      CASE
        WHEN get_current_user_role() = 'owner' THEN true
        WHEN get_current_user_role() = 'admin_pusat' THEN true
        WHEN get_current_user_role() = 'kasir_cabang' THEN (
          r.branch_id IN (
            SELECT ub.branch_id 
            FROM user_branches ub 
            WHERE ub.user_id = auth.uid()
          )
        )
        ELSE false
      END
  )
)
WITH CHECK (
  return_id IN (
    SELECT r.id FROM returns r 
    WHERE 
      CASE
        WHEN get_current_user_role() = 'owner' THEN true
        WHEN get_current_user_role() = 'admin_pusat' THEN true
        WHEN get_current_user_role() = 'kasir_cabang' THEN (
          r.branch_id IN (
            SELECT ub.branch_id 
            FROM user_branches ub 
            WHERE ub.user_id = auth.uid()
          )
        )
        ELSE false
      END
  )
);

-- Create RLS policies for product_packages
CREATE POLICY "Authenticated users can view product packages" 
ON public.product_packages 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admin can manage product packages" 
ON public.product_packages 
FOR ALL 
USING (get_current_user_role() IN ('owner', 'admin_pusat'))
WITH CHECK (get_current_user_role() IN ('owner', 'admin_pusat'));

-- Create RLS policies for returns
CREATE POLICY "Users can view returns for their branch" 
ON public.returns 
FOR SELECT 
USING (
  CASE
    WHEN get_current_user_role() = 'owner' THEN true
    WHEN get_current_user_role() = 'admin_pusat' THEN true
    WHEN get_current_user_role() = 'kasir_cabang' THEN (
      branch_id IN (
        SELECT ub.branch_id 
        FROM user_branches ub 
        WHERE ub.user_id = auth.uid()
      )
    )
    ELSE false
  END
);

CREATE POLICY "Users can manage returns for their branch" 
ON public.returns 
FOR ALL 
USING (
  CASE
    WHEN get_current_user_role() = 'owner' THEN true
    WHEN get_current_user_role() = 'admin_pusat' THEN true
    WHEN get_current_user_role() = 'kasir_cabang' THEN (
      branch_id IN (
        SELECT ub.branch_id 
        FROM user_branches ub 
        WHERE ub.user_id = auth.uid()
      )
    )
    ELSE false
  END
)
WITH CHECK (
  CASE
    WHEN get_current_user_role() = 'owner' THEN true
    WHEN get_current_user_role() = 'admin_pusat' THEN true
    WHEN get_current_user_role() = 'kasir_cabang' THEN (
      branch_id IN (
        SELECT ub.branch_id 
        FROM user_branches ub 
        WHERE ub.user_id = auth.uid()
      )
    )
    ELSE false
  END
);

-- Create RLS policies for product_batches
CREATE POLICY "Users can view product batches for their branch" 
ON public.product_batches 
FOR SELECT 
USING (
  CASE
    WHEN get_current_user_role() = 'owner' THEN true
    WHEN get_current_user_role() = 'admin_pusat' THEN true
    WHEN get_current_user_role() = 'kepala_produksi' THEN true
    WHEN get_current_user_role() = 'kasir_cabang' THEN (
      branch_id IN (
        SELECT ub.branch_id 
        FROM user_branches ub 
        WHERE ub.user_id = auth.uid()
      )
    )
    ELSE false
  END
);

CREATE POLICY "Only admin and kepala_produksi can manage product batches" 
ON public.product_batches 
FOR ALL 
USING (get_current_user_role() IN ('owner', 'admin_pusat', 'kepala_produksi'))
WITH CHECK (get_current_user_role() IN ('owner', 'admin_pusat', 'kepala_produksi'));