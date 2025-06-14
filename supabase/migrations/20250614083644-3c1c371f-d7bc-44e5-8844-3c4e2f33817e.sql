
-- First, delete any inventory records that reference these products
DELETE FROM public.inventory 
WHERE product_id IN (
  SELECT id FROM public.products 
  WHERE name IN ('Donat', 'Kue Coklat', 'Roti Manis', 'Roti Tawar')
);

-- Then delete the dummy products
DELETE FROM public.products 
WHERE name IN ('Donat', 'Kue Coklat', 'Roti Manis', 'Roti Tawar');
