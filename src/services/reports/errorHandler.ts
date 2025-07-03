
export const handleTransactionQueryError = (error: any, userRole: string) => {
  console.error('❌ Database query error:', error);
  
  // Handle specific error types
  if (error.code === 'PGRST201') {
    throw new Error('Error dalam relasi database. Silakan hubungi administrator.');
  }
  
  if (error.code === 'PGRST204') {
    throw new Error('Tidak ada data ditemukan untuk kriteria yang dipilih.');
  }
  
  if (error.message.includes('permission denied')) {
    throw new Error('Anda tidak memiliki izin untuk mengakses data ini.');
  }
  
  if (error.message.includes('relation') && error.message.includes('does not exist')) {
    throw new Error('Tabel database tidak ditemukan. Silakan hubungi administrator.');
  }
  
  // Generic error for users
  throw new Error(`Gagal mengambil data transaksi: ${error.message || 'Error tidak diketahui'}`);
};
