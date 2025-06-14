
-- 1. Create product_types enum for better categorization
CREATE TYPE product_type AS ENUM ('regular', 'package', 'bundle');

-- 2. Add product_type column to products table
ALTER TABLE products ADD COLUMN product_type product_type DEFAULT 'regular';

-- 3. Create product_packages table for managing package/bundle compositions
CREATE TABLE product_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(parent_product_id, component_product_id)
);

-- 4. Create product_batches table for tracking expiry dates and batch info
CREATE TABLE product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'sold_out')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Create returns table for managing product returns
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  processed_by UUID NOT NULL REFERENCES profiles(id),
  return_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Create return_items table for individual returned items
CREATE TABLE return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES product_batches(id),
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  condition TEXT DEFAULT 'resaleable' CHECK (condition IN ('resaleable', 'damaged', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Create stock_movements table for comprehensive audit trail
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES product_batches(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer', 'return')),
  quantity_change INTEGER NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('transaction', 'production', 'return', 'adjustment', 'transfer')),
  reference_id UUID,
  reason TEXT,
  performed_by UUID REFERENCES profiles(id),
  movement_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Add batch tracking to inventory table
ALTER TABLE inventory ADD COLUMN batch_id UUID REFERENCES product_batches(id);

-- 9. Create indexes for better performance
CREATE INDEX idx_product_packages_parent ON product_packages(parent_product_id);
CREATE INDEX idx_product_packages_component ON product_packages(component_product_id);
CREATE INDEX idx_product_batches_expiry ON product_batches(expiry_date);
CREATE INDEX idx_product_batches_status ON product_batches(status);
CREATE INDEX idx_stock_movements_product_branch ON stock_movements(product_id, branch_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX idx_returns_branch_date ON returns(branch_id, return_date);

-- 10. Add triggers for updated_at timestamps
CREATE TRIGGER update_product_batches_updated_at
  BEFORE UPDATE ON product_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Create function to automatically create stock movement records
CREATE OR REPLACE FUNCTION log_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO stock_movements (
      product_id, branch_id, batch_id, movement_type, 
      quantity_change, reference_type, performed_by
    ) VALUES (
      NEW.product_id, NEW.branch_id, NEW.batch_id, 'in',
      NEW.quantity, 'adjustment', auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.quantity != OLD.quantity THEN
      INSERT INTO stock_movements (
        product_id, branch_id, batch_id, movement_type,
        quantity_change, reference_type, performed_by
      ) VALUES (
        NEW.product_id, NEW.branch_id, NEW.batch_id, 
        CASE WHEN NEW.quantity > OLD.quantity THEN 'in' ELSE 'out' END,
        NEW.quantity - OLD.quantity, 'adjustment', auth.uid()
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for inventory movements
CREATE TRIGGER inventory_movement_trigger
  AFTER INSERT OR UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION log_stock_movement();

-- 13. Enhanced function to handle package/bundle sales
CREATE OR REPLACE FUNCTION process_package_sale()
RETURNS TRIGGER AS $$
DECLARE
  component_record RECORD;
  available_stock INTEGER;
BEGIN
  -- Check if the product is a package or bundle
  IF (SELECT product_type FROM products WHERE id = NEW.product_id) IN ('package', 'bundle') THEN
    -- Process each component in the package
    FOR component_record IN 
      SELECT pp.component_product_id, pp.quantity as component_qty
      FROM product_packages pp
      WHERE pp.parent_product_id = NEW.product_id
    LOOP
      -- Check available stock for component
      SELECT COALESCE(SUM(quantity), 0) INTO available_stock
      FROM inventory 
      WHERE product_id = component_record.component_product_id 
        AND branch_id = (SELECT branch_id FROM transactions WHERE id = NEW.transaction_id);
      
      -- Ensure sufficient stock
      IF available_stock < (component_record.component_qty * NEW.quantity) THEN
        RAISE EXCEPTION 'Insufficient stock for component product ID: %', component_record.component_product_id;
      END IF;
      
      -- Reduce component stock
      UPDATE inventory 
      SET quantity = quantity - (component_record.component_qty * NEW.quantity),
          last_updated = now()
      WHERE product_id = component_record.component_product_id 
        AND branch_id = (SELECT branch_id FROM transactions WHERE id = NEW.transaction_id);
    END LOOP;
  ELSE
    -- Handle regular product sale (existing logic)
    UPDATE inventory 
    SET quantity = quantity - NEW.quantity,
        last_updated = now()
    WHERE product_id = NEW.product_id 
      AND branch_id = (SELECT branch_id FROM transactions WHERE id = NEW.transaction_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Replace existing transaction trigger with enhanced version
DROP TRIGGER IF EXISTS update_inventory_on_transaction_trigger ON transaction_items;
CREATE TRIGGER process_sale_trigger
  AFTER INSERT ON transaction_items
  FOR EACH ROW EXECUTE FUNCTION process_package_sale();

-- 15. Function to check expiring products
CREATE OR REPLACE FUNCTION get_expiring_products(days_ahead INTEGER DEFAULT 3)
RETURNS TABLE (
  product_name TEXT,
  branch_name TEXT,
  batch_number TEXT,
  quantity INTEGER,
  expiry_date DATE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.name as product_name,
    b.name as branch_name,
    pb.batch_number,
    pb.quantity,
    pb.expiry_date,
    (pb.expiry_date - CURRENT_DATE) as days_until_expiry
  FROM product_batches pb
  JOIN products p ON pb.product_id = p.id
  JOIN branches b ON pb.branch_id = b.id
  WHERE pb.status = 'active'
    AND pb.quantity > 0
    AND pb.expiry_date <= CURRENT_DATE + days_ahead
  ORDER BY pb.expiry_date ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql;
