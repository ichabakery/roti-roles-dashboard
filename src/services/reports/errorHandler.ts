
export const handleTransactionQueryError = (error: any, userRole: string) => {
  console.error('❌ Transaction query error:', error);
  
  // Enhanced error handling with specific messages
  if (error.code === 'PGRST116') {
    throw new Error('Tabel transaksi tidak ditemukan. Silakan hubungi administrator.');
  } else if (error.code === 'PGRST201') {
    throw new Error('Tidak ada data transaksi ditemukan untuk periode dan filter yang dipilih.');
  } else if (error.message?.includes('violates row-level security')) {
    throw new Error(`Akses ditolak: Anda tidak memiliki izin untuk melihat data transaksi. Role: ${userRole}`);
  } else if (error.message?.includes('foreign key')) {
    throw new Error('Terjadi masalah dengan referensi data. Silakan hubungi administrator.');
  } else {
    throw new Error(`Gagal memuat data transaksi: ${error.message}`);
  }
};
