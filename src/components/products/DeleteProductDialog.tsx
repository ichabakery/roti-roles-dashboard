import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/products';

interface DeleteProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductDeleted: () => void;
}

export const DeleteProductDialog: React.FC<DeleteProductDialogProps> = ({
  product,
  open,
  onOpenChange,
  onProductDeleted
}) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasRelations, setHasRelations] = useState(false);
  const [relationMessage, setRelationMessage] = useState('');

  React.useEffect(() => {
    if (product && open) {
      checkProductRelations();
    }
  }, [product, open]);

  const checkProductRelations = async () => {
    if (!product) return;

    try {
      // Check transaction_items
      const { count: transactionCount } = await supabase
        .from('transaction_items')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', product.id);

      // Check inventory
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', product.id)
        .gt('quantity', 0);

      // Check order_items
      const { count: orderCount } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', product.id);

      const hasTransactions = (transactionCount || 0) > 0;
      const hasInventory = (inventoryData?.length || 0) > 0;
      const hasOrders = (orderCount || 0) > 0;

      if (hasTransactions || hasInventory || hasOrders) {
        setHasRelations(true);
        let messages = [];
        if (hasTransactions) messages.push(`${transactionCount} transaksi`);
        if (hasInventory) messages.push('stok inventory');
        if (hasOrders) messages.push(`${orderCount} pesanan`);
        setRelationMessage(messages.join(', '));
      } else {
        setHasRelations(false);
        setRelationMessage('');
      }
    } catch (error) {
      console.error('Error checking product relations:', error);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    try {
      if (hasRelations) {
        // Soft delete - set active to false (archive)
        const { error } = await supabase
          .from('products')
          .update({ active: false })
          .eq('id', product.id);

        if (error) throw error;

        toast({
          title: "Produk Diarsipkan",
          description: `${product.name} telah dinonaktifkan karena memiliki data terkait.`,
        });
      } else {
        // Hard delete
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', product.id);

        if (error) throw error;

        toast({
          title: "Produk Dihapus",
          description: `${product.name} berhasil dihapus dari database.`,
        });
      }

      onProductDeleted();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menghapus produk: ${error.message}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!product) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasRelations ? 'Arsipkan Produk?' : 'Hapus Produk?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {hasRelations ? (
              <>
                <p>
                  Produk <strong>"{product.name}"</strong> tidak dapat dihapus karena memiliki data terkait ({relationMessage}).
                </p>
                <p>
                  Produk akan <strong>diarsipkan</strong> (dinonaktifkan) dan tidak akan muncul di daftar produk aktif.
                </p>
              </>
            ) : (
              <p>
                Apakah Anda yakin ingin menghapus produk <strong>"{product.name}"</strong>? 
                Tindakan ini tidak dapat dibatalkan.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className={hasRelations ? 'bg-orange-600 hover:bg-orange-700' : 'bg-destructive hover:bg-destructive/90'}
          >
            {isDeleting ? 'Memproses...' : hasRelations ? 'Arsipkan' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
