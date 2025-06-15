
import React from "react";

// Ini hanya mock, integration produksi: ambil dari hook laporan transaksi
interface ReceiptHistoryItem {
  id: string;
  date: string;
  branch: string;
  cashier: string;
  total: number;
}

const MOCK_HISTORY: ReceiptHistoryItem[] = [
  {
    id: "23123aaf",
    date: "2025-06-15T10:20:09+07:00",
    branch: "Cabang A",
    cashier: "Maya",
    total: 23000
  },
  {
    id: "543b123c",
    date: "2025-06-13T08:09:00+07:00",
    branch: "Cabang B",
    cashier: "Tono",
    total: 54000
  }
];

export const ReceiptHistory: React.FC = () => {
  // TODO: ganti dengan fetch data riil
  const data = MOCK_HISTORY;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Riwayat Nota Transaksi</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1">Tgl/Waktu</th>
              <th className="px-2 py-1">ID Nota</th>
              <th className="px-2 py-1">Cabang</th>
              <th className="px-2 py-1">Kasir</th>
              <th className="px-2 py-1 text-right">Total</th>
              <th className="px-2 py-1">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-2 py-1">{new Date(row.date).toLocaleString("id-ID")}</td>
                <td className="px-2 py-1">{row.id}</td>
                <td className="px-2 py-1">{row.branch}</td>
                <td className="px-2 py-1">{row.cashier}</td>
                <td className="px-2 py-1 text-right">Rp {row.total.toLocaleString("id-ID")}</td>
                <td className="px-2 py-1">
                  {/* Future: popup preview & download lagi */}
                  <button className="text-blue-600 underline text-xs">Lihat & Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
