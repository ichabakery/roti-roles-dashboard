
import { supabase } from '@/integrations/supabase/client';
import { ProductPackage, Product } from '@/types/products';

export const createProductPackage = async (
  parentProductId: string,
  components: { productId: string; quantity: number }[]
) => {
  console.log('Creating product package:', { parentProductId, components });

  const packageData = components.map(comp => ({
    parent_product_id: parentProductId,
    component_product_id: comp.productId,
    quantity: comp.quantity
  }));

  const { data, error } = await supabase
    .from('product_packages')
    .insert(packageData)
    .select();

  if (error) throw error;
  return data;
};

export const fetchProductPackages = async (parentProductId: string): Promise<ProductPackage[]> => {
  const { data, error } = await supabase
    .from('product_packages')
    .select(`
      id,
      parent_product_id,
      component_product_id,
      quantity,
      created_at,
      component_product:products!component_product_id(
        id, name, description, price, active, image_url, created_at, product_type
      )
    `)
    .eq('parent_product_id', parentProductId);

  if (error) throw error;
  return data || [];
};

export const updateProductPackage = async (
  packageId: string,
  quantity: number
) => {
  const { data, error } = await supabase
    .from('product_packages')
    .update({ quantity })
    .eq('id', packageId);

  if (error) throw error;
  return data;
};

export const deleteProductPackage = async (packageId: string) => {
  const { data, error } = await supabase
    .from('product_packages')
    .delete()
    .eq('id', packageId);

  if (error) throw error;
  return data;
};

export const validatePackageStock = async (
  productId: string,
  branchId: string,
  requestedQuantity: number
): Promise<{ isValid: boolean; missingComponents: any[] }> => {
  console.log('Validating package stock:', { productId, branchId, requestedQuantity });

  // Get package components
  const { data: components, error } = await supabase
    .from('product_packages')
    .select(`
      component_product_id,
      quantity,
      component_product:products!component_product_id(name)
    `)
    .eq('parent_product_id', productId);

  if (error) throw error;

  if (!components || components.length === 0) {
    return { isValid: true, missingComponents: [] };
  }

  const missingComponents = [];

  // Check stock for each component
  for (const component of components) {
    const { data: inventory } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', component.component_product_id)
      .eq('branch_id', branchId)
      .maybeSingle();

    const availableStock = inventory?.quantity || 0;
    const requiredStock = component.quantity * requestedQuantity;

    if (availableStock < requiredStock) {
      missingComponents.push({
        productName: component.component_product?.name || 'Unknown',
        required: requiredStock,
        available: availableStock,
        deficit: requiredStock - availableStock
      });
    }
  }

  return {
    isValid: missingComponents.length === 0,
    missingComponents
  };
};
