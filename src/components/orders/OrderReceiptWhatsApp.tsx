import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/services/orderService';

interface OrderReceiptWhatsAppProps {
  order: Order;
}

export const OrderReceiptWhatsApp: React.FC<OrderReceiptWhatsAppProps> = ({ order }) => {
  const { toast } = useToast();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu Konfirmasi';
      case 'confirmed': return 'Dikonfirmasi';
      case 'in_production': return 'Sedang Diproduksi';
      case 'ready': return 'Siap Diambil';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  const getPaymentTypeLabel = (paymentType: string) => {
    switch (paymentType) {
      case 'cash_on_delivery': return 'Bayar saat ambil';
      case 'dp': return 'DP (Uang Muka)';
      case 'full_payment': return 'Lunas';
      default: return paymentType;
    }
  };

  const generateWhatsAppMessage = () => {
    const header = `*🍞 ICHA BAKERY - ${order.branch_name?.toUpperCase()}*`;
    const branchInfo = order.branch_address ? `📍 ${order.branch_address}` : '';
    const branchPhone = order.branch_phone ? `📞 ${order.branch_phone}` : '';
    const orderInfo = `📋 *BUKTI PEMESANAN*`;
    const orderNumber = `🧾 No. Pesanan: *${order.order_number}*`;
    const status = `📊 Status: *${getStatusLabel(order.status)}*`;
    const orderDate = `📅 Tanggal Pesan: ${new Date(order.order_date).toLocaleDateString('id-ID')}`;
    const deliveryDate = `📦 Tanggal Ambil: *${new Date(order.delivery_date).toLocaleDateString('id-ID')}*`;
    
    const customerInfo = `\n👤 *PELANGGAN*\n` +
      `Nama: ${order.customer_name}` +
      (order.customer_phone ? `\nTelepon: ${order.customer_phone}` : '');

    const items = order.items?.map((item: any, index: number) => 
      `${index + 1}. ${item.productName}\n   ${item.quantity} x Rp ${item.unitPrice.toLocaleString('id-ID')} = Rp ${(item.quantity * item.unitPrice).toLocaleString('id-ID')}`
    ).join('\n') || '';

    const itemsSection = `\n🛍️ *DETAIL PESANAN*\n${items}`;
    
    const payment = `\n💰 *PEMBAYARAN*\n` +
      `Total: *Rp ${order.total_amount.toLocaleString('id-ID')}*\n` +
      `Metode: ${getPaymentTypeLabel(order.payment_type || 'cash_on_delivery')}`;

    const notes = order.notes ? `\n📝 *CATATAN*\n${order.notes}` : '';
    
    const footer = `\n✅ Terima kasih atas pesanan Anda!\n` +
      `🙏 Mohon simpan bukti ini untuk pengambilan pesanan.`;

    return [
      header,
      branchInfo,
      branchPhone,
      orderInfo,
      orderNumber,
      status,
      orderDate,
      deliveryDate,
      customerInfo,
      itemsSection,
      payment,
      notes,
      footer
    ].filter(Boolean).join('\n');
  };

  const handleCopyToClipboard = async () => {
    try {
      const message = generateWhatsAppMessage();
      await navigator.clipboard.writeText(message);
      toast({
        title: "Berhasil",
        description: "Pesan telah disalin ke clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyalin pesan",
        variant: "destructive"
      });
    }
  };

  const handleSendWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleSendWhatsApp}
        className="flex-1 bg-green-600 hover:bg-green-700"
        size="sm"
      >
        <Phone className="h-4 w-4 mr-2" />
        Kirim WhatsApp
      </Button>
      <Button
        onClick={handleCopyToClipboard}
        variant="outline"
        size="sm"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
};