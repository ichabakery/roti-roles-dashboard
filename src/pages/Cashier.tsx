import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CreditCard, Delete, Printer, Search, ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

interface Branch {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  branch_id: string;
  cashier_id: string;
  transaction_date: string;
  total_amount: number;
  payment_method: string;
  notes: string | null;
  status: string;
}

const Cashier = () => {
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  
  // State for items dalam keranjang
  const [cart, setCart] = useState<Array<{ product: Product, quantity: number }>>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  useEffect(() => {
    if (user) {
      initializeData();
    }
  }, [user]);
  
  useEffect(() => {
    if (user?.role === 'kasir_cabang' && user.branchId) {
      console.log('Setting branch for kasir:', user.branchId);
      setSelectedBranch(user.branchId);
      setBranchError(null);
      setHasAccess(true);
      setIsCheckingAccess(false);
    } else if (user?.role === 'kasir_cabang' && !user.branchId) {
      console.error('Kasir user without branch assignment:', user);
      setBranchError('Akun kasir Anda belum dikaitkan dengan cabang. Silakan hubungi administrator.');
      setHasAccess(false);
      setIsCheckingAccess(false);
    } else {
      setHasAccess(true);
      setIsCheckingAccess(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedBranch && hasAccess) {
      fetchProducts();
    }
  }, [selectedBranch, hasAccess]);

  const initializeData = async () => {
    try {
      console.log('Initializing cashier data...');
      await fetchBranches();
    } catch (error) {
      console.error('Error initializing data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menginisialisasi data aplikasi",
      });
    }
  };

  const verifyBranchAccess = async (branchId: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const { data, error } = await supabase
        .from('user_branches')
        .select('branch_id')
        .eq('user_id', user.id)
        .eq('branch_id', branchId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error verifying branch access:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error verifying branch access:', error);
      return false;
    }
  };

  const fetchBranches = async () => {
    try {
      console.log('Fetching branches for current user...');
      
      if (!user?.id) {
        console.log('No user ID available');
        return;
      }

      // For kasir_cabang, get only their assigned branches
      if (user.role === 'kasir_cabang') {
        const { data: userBranches, error } = await supabase
          .from('user_branches')
          .select(`
            branch_id,
            branches:branch_id (
              id,
              name,
              address,
              phone
            )
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user branches:', error);
          setBranchError('Gagal memuat data cabang yang dikaitkan dengan akun Anda');
          setHasAccess(false);
          return;
        }

        const branchData = (userBranches || [])
          .map(ub => ub.branches)
          .filter(branch => branch)
          .map(branch => ({
            id: branch.id,
            name: branch.name
          }));
        
        console.log('Kasir branches:', branchData);
        setBranches(branchData);
        
        if (branchData.length > 0 && !selectedBranch) {
          setSelectedBranch(branchData[0].id);
          setHasAccess(true);
        } else if (branchData.length === 0) {
          setBranchError('Akun Anda belum dikaitkan dengan cabang manapun. Silakan hubungi administrator.');
          setHasAccess(false);
        }
      } else {
        // For owner and admin_pusat, get all branches
        const { data, error } = await supabase
          .from('branches')
          .select('id, name')
          .order('name');

        if (error) {
          console.error('Error fetching all branches:', error);
          setBranchError('Gagal memuat data cabang');
          setHasAccess(false);
          return;
        }

        setBranches(data || []);
        
        if (data && data.length > 0 && !selectedBranch) {
          setSelectedBranch(data[0].id);
          setHasAccess(true);
        }
      }
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      setBranchError(`Gagal memuat data cabang: ${error.message}`);
      setHasAccess(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      console.log('Fetching products...');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        throw error;
      }

      console.log('Products fetched:', data?.length || 0);
      setProducts(data || []);
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
  
  // Filter produk berdasarkan pencarian
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }

    toast({
      title: "Produk ditambahkan",
      description: `${product.name} ditambahkan ke keranjang`,
    });
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

  const handleProcessPayment = async () => {
    if (cart.length === 0 || !selectedBranch || !user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Keranjang kosong, cabang belum dipilih, atau user tidak terautentikasi",
      });
      return;
    }

    try {
      console.log('Processing payment...');
      console.log('User ID:', user.id);
      console.log('Branch ID:', selectedBranch);
      console.log('Cart items:', cart.length);
      
      const totalAmount = calculateTotal();
      console.log('Total amount:', totalAmount);
      
      // Verify user has access to this branch
      if (user.role === 'kasir_cabang') {
        const accessVerified = await verifyBranchAccess(selectedBranch);
        if (!accessVerified) {
          console.error('User does not have access to this branch');
          toast({
            variant: "destructive",
            title: "Error",
            description: "Anda tidak memiliki akses ke cabang ini",
          });
          return;
        }
      }

      // Create transaction
      const transactionData = {
        branch_id: selectedBranch,
        cashier_id: user.id,
        total_amount: totalAmount,
        payment_method: paymentMethod
      };

      console.log('Creating transaction with data:', transactionData);

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        throw new Error(`Gagal membuat transaksi: ${transactionError.message}`);
      }

      console.log('Transaction created successfully:', transaction);

      // Create transaction items
      const transactionItems = cart.map(item => ({
        transaction_id: transaction.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_per_item: item.product.price,
        subtotal: item.product.price * item.quantity
      }));

      console.log('Creating transaction items:', transactionItems);

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) {
        console.error('Transaction items error:', itemsError);
        throw new Error(`Gagal menyimpan item transaksi: ${itemsError.message}`);
      }

      console.log('Transaction items created successfully');

      // Success - Store complete transaction data
      setLastTransaction(transaction);
      setShowSuccessDialog(true);
      
      // Clear cart
      setCart([]);
      
      toast({
        title: "Pembayaran Berhasil",
        description: `Transaksi selesai dengan ID: ${transaction.id.substring(0, 8)}...`,
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        variant: "destructive",
        title: "Error Pembayaran",
        description: error.message || "Gagal memproses pembayaran",
      });
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Tunai';
      case 'card': return 'Kartu Kredit/Debit';
      case 'transfer': return 'Transfer Bank';
      case 'qris': return 'QRIS';
      default: return method;
    }
  };

  // Show loading if user is not ready yet
  if (!user || isCheckingAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show access denied if user doesn't have access
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {branchError || 'Anda tidak memiliki akses ke fitur kasir.'}
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row gap-6 h-full">
        {/* Panel Produk */}
        <div className="md:w-2/3 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Kasir</h2>
              <p className="text-muted-foreground">
                {branches.find(b => b.id === selectedBranch)?.name || 'Pilih Cabang'}
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

          {/* Branch Error Alert */}
          {branchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{branchError}</AlertDescription>
            </Alert>
          )}
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <Card 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardHeader className="p-4 pb-0">
                    <div className="text-4xl mb-2 flex justify-center">
                      {product.name.includes('Roti') ? '🍞' : 
                       product.name.includes('Donat') ? '🍩' : 
                       product.name.includes('Coklat') ? '🍫' : 
                       product.name.includes('Kue') ? '🍰' : '🧁'}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <CardTitle className="text-sm font-medium">{product.name}</CardTitle>
                    <p className="text-sm font-bold mt-1">
                      Rp {product.price.toLocaleString('id-ID')}
                    </p>
                  </CardContent>
                </Card>
              ))}
              
              {filteredProducts.length === 0 && (
                <div className="col-span-4 flex items-center justify-center h-64 border rounded-md">
                  <div className="text-center">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk yang tersedia'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
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
              {/* Select branch for owner and admin_pusat */}
              {(user?.role === 'owner' || user?.role === 'admin_pusat') && (
                <div className="mb-4">
                  <label className="text-sm font-medium mb-1 block">Cabang</label>
                  <Select
                    value={selectedBranch || ''}
                    onValueChange={(value) => setSelectedBranch(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Cabang" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Metode Pembayaran */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Metode Pembayaran</label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tunai</SelectItem>
                    <SelectItem value="card">Kartu Kredit/Debit</SelectItem>
                    <SelectItem value="transfer">Transfer Bank</SelectItem>
                    <SelectItem value="qris">QRIS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
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
                    disabled={cart.length === 0 || !selectedBranch || !!branchError}
                    onClick={handleProcessPayment}
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

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Check className="h-6 w-6 text-green-500 mr-2" />
              Pembayaran Berhasil
            </DialogTitle>
            <DialogDescription>
              Transaksi telah berhasil diproses
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium">ID Transaksi: {lastTransaction?.id.substring(0, 8)}...</p>
            <p>Total: Rp {lastTransaction?.total_amount.toLocaleString('id-ID')}</p>
            <p>Metode: {getPaymentMethodLabel(lastTransaction?.payment_method || '')}</p>
            <p>Waktu: {lastTransaction ? new Date(lastTransaction.transaction_date).toLocaleString('id-ID') : ''}</p>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSuccessDialog(false)}
              className="flex-1"
            >
              Tutup
            </Button>
            <Button 
              onClick={() => {
                setShowSuccessDialog(false);
                toast({
                  title: "Cetak Nota",
                  description: "Nota sedang dicetak...",
                });
              }}
              className="flex-1"
            >
              <Printer className="mr-2 h-4 w-4" />
              Cetak Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Cashier;
