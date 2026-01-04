import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Package, Archive, AlertTriangle, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { ProductType, Product } from '@/types/products';
import { fetchProductsWithType } from '@/services/enhancedProductService';
import { useProductBatches } from '@/hooks/useProductBatches';
import { ProductTypeSelector } from '@/components/products/ProductTypeSelector';
import { ProductPackageManager } from '@/components/products/ProductPackageManager';
import { BatchManagement } from '@/components/products/BatchManagement';
import { ExpiryMonitoring } from '@/components/products/ExpiryMonitoring';
import { EnhancedAddProductDialog } from '@/components/products/EnhancedAddProductDialog';
import { EditProductDialog } from '@/components/products/EditProductDialog';
import { DeleteProductDialog } from '@/components/products/DeleteProductDialog';
import { ProductSearchCommand } from '@/components/products/ProductSearchCommand';
import { useNavigate } from 'react-router-dom';
import { PRODUCT_CATEGORIES, getCategoryLabel } from '@/constants/productCategories';

const EnhancedProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductType, setSelectedProductType] = useState<ProductType>('regular');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lastEditedProductId, setLastEditedProductId] = useState<string | null>(null);
  const { toast } = useToast();
  const { expiringProducts, fetchExpiring } = useProductBatches();

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') {
      return products;
    }
    return products.filter(p => (p as any).category === selectedCategory);
  }, [products, selectedCategory]);

  // Get unique categories that have products
  const availableCategories = useMemo(() => {
    const categoriesWithProducts = new Set(products.map(p => (p as any).category || 'produk_utama'));
    return PRODUCT_CATEGORIES.filter(cat => categoriesWithProducts.has(cat.value));
  }, [products]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredProducts };
    }
    
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach(product => {
      const cat = (product as any).category || 'produk_utama';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(product);
    });
    
    // Sort by category order
    const orderedGroups: Record<string, Product[]> = {};
    PRODUCT_CATEGORIES.forEach(cat => {
      if (groups[cat.value]) {
        orderedGroups[cat.value] = groups[cat.value];
      }
    });
    
    return orderedGroups;
  }, [filteredProducts, selectedCategory]);

  useEffect(() => {
    fetchProducts();
    fetchExpiring(7);
  }, [selectedProductType]);

  // Scroll to last edited product after data refresh
  useEffect(() => {
    if (lastEditedProductId && !loading) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        const element = document.getElementById(`product-${lastEditedProductId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          element.classList.add('ring-2', 'ring-primary', 'transition-all');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary');
            setLastEditedProductId(null);
          }, 2000);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, lastEditedProductId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProductsWithType(selectedProductType);
      setProducts(data);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data produk: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditDialogOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleProductUpdated = () => {
    // Save the edited product ID before refreshing
    if (editingProduct) {
      setLastEditedProductId(editingProduct.id);
    }
    fetchProducts();
  };

  const getProductTypeIcon = (type: ProductType) => {
    switch (type) {
      case 'package': return <Package className="h-4 w-4" />;
      case 'bundle': return <Archive className="h-4 w-4" />;
      default: return null;
    }
  };

  const getProductTypeBadge = (type: ProductType) => {
    const colors = {
      regular: 'default',
      package: 'secondary',
      bundle: 'outline'
    } as const;

    return (
      <Badge variant={colors[type]} className="flex items-center gap-1">
        {getProductTypeIcon(type)}
        {type === 'regular' ? 'Reguler' : type === 'package' ? 'Paket' : 'Bundling'}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header - responsive layout */}
        <div className="flex flex-col gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 w-full sm:w-auto self-start"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Kembali ke Produk Sederhana</span>
          </Button>
          
          <div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight">Manajemen Produk Lengkap</h2>
            <p className="text-sm text-muted-foreground">
              Kelola produk reguler, paket, bundling, dan tracking expired
            </p>
          </div>
          
          {expiringProducts.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3 sm:pt-6">
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="text-sm font-semibold">
                    {expiringProducts.length} produk akan expired dalam 7 hari!
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs defaultValue="products" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="products" className="text-xs sm:text-sm py-2">Produk</TabsTrigger>
            <TabsTrigger value="packages" className="text-xs sm:text-sm py-2">Paket & Bundling</TabsTrigger>
            <TabsTrigger value="batches" className="text-xs sm:text-sm py-2">Batch</TabsTrigger>
            <TabsTrigger value="expiry" className="text-xs sm:text-sm py-2">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-lg sm:text-xl">Daftar Produk</CardTitle>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                      <ProductTypeSelector
                        selectedType={selectedProductType}
                        onTypeChange={setSelectedProductType}
                      />
                      <EnhancedAddProductDialog onProductAdded={fetchProducts} />
                    </div>
                  </div>
                  <ProductSearchCommand
                    products={products}
                    onSelectProduct={handleEditProduct}
                    placeholder="Cari produk untuk edit..."
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Category Tabs */}
                    <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                      <TabsList className="flex flex-wrap h-auto gap-1">
                        <TabsTrigger value="all" className="text-xs sm:text-sm">
                          Semua
                        </TabsTrigger>
                        {availableCategories.map(cat => (
                          <TabsTrigger key={cat.value} value={cat.value} className="text-xs sm:text-sm">
                            {cat.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>

                    {products.length === 0 ? (
                      <div className="text-center py-8 space-y-4">
                        <div className="text-muted-foreground">
                          Belum ada produk {selectedProductType === 'regular' ? 'reguler' : selectedProductType === 'package' ? 'paket' : 'bundling'}
                        </div>
                        <EnhancedAddProductDialog onProductAdded={fetchProducts} />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                          <div key={category} className="space-y-3">
                            {selectedCategory === 'all' && (
                              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                                {getCategoryLabel(category)}
                              </h3>
                            )}
                            <div className="grid gap-4">
                              {categoryProducts.map((product) => (
                                <div 
                                  key={product.id} 
                                  id={`product-${product.id}`}
                                  className="flex items-center justify-between p-4 border rounded-lg transition-all duration-300"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold">{product.name}</h3>
                                      {getProductTypeBadge(product.product_type)}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{product.description}</p>
                                    <p className="font-bold text-green-600">Rp {product.price.toLocaleString('id-ID')}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEditProduct(product)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleDeleteProduct(product)}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages">
            <ProductPackageManager />
          </TabsContent>

          <TabsContent value="batches">
            <BatchManagement />
          </TabsContent>

          <TabsContent value="expiry">
            <ExpiryMonitoring />
          </TabsContent>
        </Tabs>

        <EditProductDialog
          product={editingProduct}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onProductUpdated={handleProductUpdated}
        />

        <DeleteProductDialog
          product={deletingProduct}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onProductDeleted={handleProductUpdated}
        />
      </div>
    </DashboardLayout>
  );
};

export default EnhancedProducts;
