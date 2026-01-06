-- Fix: Update return_items condition constraint to include 'sample' and 'bonus'
ALTER TABLE return_items DROP CONSTRAINT IF EXISTS return_items_condition_check;

ALTER TABLE return_items ADD CONSTRAINT return_items_condition_check 
CHECK (condition = ANY (ARRAY['resaleable'::text, 'damaged'::text, 'expired'::text, 'sample'::text, 'bonus'::text]));