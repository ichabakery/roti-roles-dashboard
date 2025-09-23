import { supabase } from '@/integrations/supabase/client';
import { createInitialStock } from '@/services/inventoryV1Service';

export interface DemoProduct {
  name: string;
  price: number;
  description: string;
  stock: number;
  rop: number;
  uom: string;
  shelf_life: number;
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    name: 'Bolu Batik Kecil',
    price: 15000,
    description: 'Bolu batik ukuran kecil dengan cokelat leleh',
    stock: 120,
    rop: 30,
    uom: 'pcs',
    shelf_life: 3
  },
  {
    name: 'Bolu Pisang',
    price: 12000,
    description: 'Bolu lembut dengan rasa pisang asli',
    stock: 90,
    rop: 30,
    uom: 'pcs',
    shelf_life: 3
  },
  {
    name: 'Roti Maryam',
    price: 8000,
    description: 'Roti maryam tradisional yang lembut',
    stock: 50,
    rop: 25,
    uom: 'pcs',
    shelf_life: 2
  },
  {
    name: 'Roti Boy',
    price: 10000,
    description: 'Roti dengan topping mentega dan gula',
    stock: 80,
    rop: 40,
    uom: 'pcs',
    shelf_life: 3
  },
  {
    name: 'Roti Pisang',
    price: 9000,
    description: 'Roti isi pisang yang manis',
    stock: 110,
    rop: 30,
    uom: 'pcs',
    shelf_life: 3
  },
  {
    name: 'Cake Ikan',
    price: 35000,
    description: 'Cake berbentuk ikan dengan krim vanilla',
    stock: 18,
    rop: 12,
    uom: 'pcs',
    shelf_life: 2
  },
  {
    name: 'Bolu Pisang Kecil',
    price: 8000,
    description: 'Bolu pisang ukuran mini',
    stock: 60,
    rop: 24,
    uom: 'pcs',
    shelf_life: 3
  },
  {
    name: 'Roti Bluder',
    price: 25000,
    description: 'Roti bluder dengan kismis dan mentega',
    stock: 45,
    rop: 20,
    uom: 'pcs',
    shelf_life: 4
  }
];

/**
 * Create demo products with inventory data
 */
export const createDemoProducts = async (branchId: string): Promise<void> => {
  try {
    console.log('Creating demo products...');

    for (const demoProduct of DEMO_PRODUCTS) {
      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: demoProduct.name,
          description: demoProduct.description,
          price: demoProduct.price,
          active: true,
          has_expiry: true,
          default_expiry_days: demoProduct.shelf_life,
          uom: demoProduct.uom,
          reorder_point: demoProduct.rop,
          lead_time_days: 2,
          shelf_life_days: demoProduct.shelf_life,
        })
        .select()
        .single();

      if (productError) {
        console.error('Error creating demo product:', productError);
        continue;
      }

      // Create initial stock
      if (product && demoProduct.stock > 0) {
        await createInitialStock(product.id, branchId, demoProduct.stock);
      }

      console.log(`✅ Created demo product: ${demoProduct.name}`);
    }

    console.log('Demo products created successfully');
  } catch (error) {
    console.error('Error creating demo products:', error);
    throw error;
  }
};

/**
 * Reset demo data (delete existing demo products and recreate)
 */
export const resetDemoData = async (branchId: string): Promise<void> => {
  try {
    console.log('Resetting demo data...');

    // Delete existing demo products (this will cascade to inventory and adjustments)
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .in('name', DEMO_PRODUCTS.map(p => p.name));

    if (deleteError) {
      console.error('Error deleting existing demo products:', deleteError);
      // Continue anyway - might be first time setup
    }

    // Recreate demo products
    await createDemoProducts(branchId);

    console.log('Demo data reset completed');
  } catch (error) {
    console.error('Error resetting demo data:', error);
    throw error;
  }
};