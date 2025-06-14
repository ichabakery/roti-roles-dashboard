
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductType } from '@/types/products';

export const createProduct = async (productData: {
  name: string;
  description?: string;
  price: number;
  productType: ProductType;
  imageUrl?: string;
}) => {
  console.log('Creating product with type:', productData);

  const { data, error } = await supabase
    .from('products')
    .insert({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      product_type: productData.productType,
      image_url: productData.imageUrl,
      active: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const fetchProductsWithType = async (
  productType?: ProductType,
  activeOnly: boolean = true
): Promise<Product[]> => {
  let query = supabase
    .from('products')
    .select('*')
    .order('name');

  if (activeOnly) {
    query = query.eq('active', true);
  }

  if (productType) {
    query = query.eq('product_type', productType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const updateProductType = async (productId: string, productType: ProductType) => {
  const { data, error } = await supabase
    .from('products')
    .update({ product_type: productType })
    .eq('id', productId);

  if (error) throw error;
  return data;
};

export const getProductWithPackages = async (productId: string) => {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (productError) throw productError;

  if (product.product_type === 'package' || product.product_type === 'bundle') {
    const { data: packages, error: packagesError } = await supabase
      .from('product_packages')
      .select(`
        id,
        component_product_id,
        quantity,
        component_product:products!component_product_id(
          id, name, price, product_type
        )
      `)
      .eq('parent_product_id', productId);

    if (packagesError) throw packagesError;

    return { ...product, packages: packages || [] };
  }

  return { ...product, packages: [] };
};
