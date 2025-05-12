
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CreditCard, Delete, Printer, Search, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Cashier = () => {
  const { user } = useAuth();
  
  // Data dummy untuk produk yang dijual
  const products = [
    { id: '1', name: 'Roti Tawar', price: 15000, image: '🍞' },
    { id: '2', name: 'Croissant', price: 12000, image: '🥐' },
    { id: '3', name: 'Donat', price: 8000, image: '🍩' },
    { id: '4', name: 'Cupcake', price: 10000, image: '🧁' },
    { id: '5', name: 'Kue Tar', price: 200000, image: '🎂' },
    { id: '6', name: 'Roti Coklat', price: 18000, image: '🍫' },
    { id: '7', name: 'Bakpau', price: 14000, image: '🧁' },
    { id: '8', name: 'Baguette', price: 25000, image: '🥖' },
  ];

  // State untuk items dalam keranjang
  const [cart, setCart] = React.useState<Array<{ product: any, quantity: number }>>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Filter produk berdasarkan pencarian
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const addToCart = (product: any) => {
    // Cek apakah produk sudah ada di keranjang
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      // Update quantity jika sudah ada
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // Tambah item baru ke keranjang
      setCart([...cart, { product, quantity: 1 }]);
    }
  };
  
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity } 
        : item
    ));
  };
  
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row gap-6 h-full">
        {/* Panel Produk */}
        <div className="md:w-2/3 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Kasir</h2>
              <p className="text-muted-foreground">
                {user?.role === 'kasir_cabang' && 'Cabang: Cabang Utama'}
              </p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <Card 
                key={product.id}
                onClick={() => addToCart(product)}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardHeader className="p-4 pb-0">
                  <div className="text-4xl mb-2 flex justify-center">{product.image}</div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <CardTitle className="text-sm font-medium">{product.name}</CardTitle>
                  <p className="text-sm font-bold mt-1">
                    Rp {product.price.toLocaleString('id-ID')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Panel Keranjang */}
        <div className="md:w-1/3">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">
                <div className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Keranjang
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full flex flex-col">
              {/* Daftar item di keranjang */}
              <div className="flex-1 overflow-auto">
                {cart.length > 0 ? (
                  <ul className="space-y-2">
                    {cart.map(item => (
                      <li key={item.product.id} className="flex justify-between items-center py-2 border-b">
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm">Rp {item.product.price.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.product.id, item.quantity - 1);
                            }}
                          >
                            -
                          </Button>
                          <span>{item.quantity}</span>
                          <Button 
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.product.id, item.quantity + 1);
                            }}
                          >
                            +
                          </Button>
                          <Button 
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromCart(item.product.id);
                            }}
                          >
                            <Delete className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mb-2" />
                    <p>Keranjang kosong</p>
                    <p className="text-sm">Klik produk untuk menambahkan</p>
                  </div>
                )}
              </div>
              
              {/* Total dan tombol pembayaran */}
              <div className="pt-4 border-t mt-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Subtotal</span>
                  <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-bold">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    className="w-full"
                    disabled={cart.length === 0}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Bayar
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full"
                    disabled={cart.length === 0}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Nota
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Cashier;
