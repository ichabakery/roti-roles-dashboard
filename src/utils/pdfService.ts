
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Opsi branding, default/ambil dari pengaturan kalau sudah terintegrasi.
export interface BrandingOptions {
  logoUrl?: string;
  storeName: string;
  address?: string;
  phone?: string;
}

interface ProductForPDF {
  name: string;
  quantity: number;
  price: number;
}

interface PDFReceiptData {
  branchName: string;
  cashierName: string;
  transactionDate: string;
  products: ProductForPDF[];
  total: number;
  received?: number;
  change?: number;
  transactionId?: string;
  branding?: BrandingOptions;
}

export async function generateSalesReceiptPDF(data: PDFReceiptData): Promise<jsPDF> {
  const {
    branchName,
    cashierName,
    transactionDate,
    products,
    total,
    received,
    change,
    transactionId,
    branding,
  } = data;

  const doc = new jsPDF();
  
  // Logo jika ada
  let y = 10;
  if (branding?.logoUrl) {
    try {
      const imgData = await getBase64FromUrl(branding.logoUrl);
      doc.addImage(imgData, 'PNG', 82, y, 46, 18); // center for A4
      y += 20;
    } catch (e) {
      // skip logo jika gagal
      y += 5;
    }
  }
  // Nama toko & alamat
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(branding?.storeName || "Toko Roti Makmur", 105, y + 10, {align: "center"});
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (branding?.address) {
    doc.text(branding.address, 105, y + 16, { align: 'center' });
  }
  if (branding?.phone) {
    doc.text(`Telp: ${branding.phone}`, 105, y + 22, { align: 'center' });
  }

  let tY = y + 28;
  // Info transaksi
  doc.setFontSize(10);
  doc.text(`Cabang: ${branchName}`, 14, tY);
  doc.text(`Kasir: ${cashierName}`, 80, tY);
  doc.text(new Date(transactionDate).toLocaleString("id-ID"), 160, tY, { align: 'right' });
  tY += 7;
  if (transactionId) {
    doc.text(`ID Transaksi: ${(transactionId || "").substring(0,8)}`, 14, tY);
    tY += 7;
  }
  
  // Table produk
  autoTable(doc, {
    startY: tY,
    styles: { fontSize: 9 },
    head: [['Item', 'Qty', 'Subtotal']],
    body: products.map(p => [
      p.name,
      p.quantity,
      `Rp ${p.price.toLocaleString("id-ID")}`
    ]),
    margin: { right: 14, left: 14 },
    theme: "striped"
  });

  let tableY = (doc as any).lastAutoTable.finalY+4 || tY + products.length * 6 + 15;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Total`, 130, tableY);
  doc.text(`Rp ${total.toLocaleString("id-ID")}`, 196, tableY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (received !== undefined && change !== undefined) {
    doc.text(`Bayar`, 130, tableY + 6);
    doc.text(`Rp ${received.toLocaleString("id-ID")}`, 196, tableY + 6, { align: "right" });
    doc.text(`Kembalian`, 130, tableY + 12);
    doc.text(`Rp ${change.toLocaleString("id-ID")}`, 196, tableY + 12, { align: "right" });
    tableY += 12;
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.text("Terima kasih telah berbelanja! 🙏", 105, tableY + 16, {align: "center"});

  return doc;
}

async function getBase64FromUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
}
