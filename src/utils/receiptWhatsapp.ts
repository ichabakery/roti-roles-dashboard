
interface ReceiptProduct {
  name: string;
  quantity: number;
  price: number;
}

export function salesReceiptToWhatsapp({
  branchName,
  transactionId,
  transactionDate,
  products,
  total
}: {
  branchName: string;
  transactionId?: string;
  transactionDate: string;
  products: ReceiptProduct[];
  total: number;
}) {
  let header = `[Toko Roti Makmur - ${branchName}]`;
  let idLine = transactionId ? `🧾 Pesanan ${transactionId.substring(0,8)}` : "";
  let dateLine = `🗓️ ${new Date(transactionDate).toLocaleString("id-ID")}`;
  let items = `📋 Item:\n` + 
    products.map(p => `- ${p.name} x${p.quantity}: Rp ${p.price.toLocaleString("id-ID")}`).join("\n");
  let totalLine = `💰 Total: Rp ${total.toLocaleString("id-ID")}`;
  let thanks = `Terima kasih telah berbelanja! 🙏`;
  return [header, idLine, dateLine, items, totalLine, thanks].filter(Boolean).join('\n');
}
