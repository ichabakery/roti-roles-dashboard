# Simple Inventory V1 - Implementation Guide

## 🚀 Overview
Simple Inventory V1 telah berhasil diimplementasikan dengan pendekatan **additive-only** yang aman untuk backward compatibility. Sistem ini menambahkan fitur inventori sederhana tanpa merusak modul yang sudah berjalan.

## ✅ Features Implemented

### 1. Database Schema (Additive)
- ✅ Kolom nullable di tabel `products`: `sku`, `uom`, `reorder_point`, `lead_time_days`, `shelf_life_days`, `cost_per_unit`
- ✅ Tabel `stock_adjustments` untuk tracking pergerakan stok
- ✅ Auto-generate SKU trigger
- ✅ Function `create_initial_stock()` untuk stok awal

### 2. Feature Flags System
- ✅ `INVENTORY_SIMPLE_V1=true` - Enable/disable fitur inventori V1
- ✅ `ALLOW_NEGATIVE_STOCK_OVERRIDE=false` - Override stok negatif dengan approval
- ✅ `DEMO_MODE=false` - Mode demo dengan data contoh

### 3. Enhanced Product Forms
- ✅ **AddProductDialog**: Section collapsible "Inventori (Ringkas)" dengan:
  - SKU (auto-generate jika kosong)
  - Unit of Measure (pcs, box, pak, kg, ltr)
  - Stok Awal (untuk inisialisasi)
  - Reorder Point (default: 30)
  - Lead Time (default: 2 hari)
  - Shelf Life (jika produk memiliki expiry)

- ✅ **EditProductDialog**: Section inventori yang sama (tanpa stok awal)

### 4. Enhanced Inventory Page
- ✅ **KPI Cards**: SKU Aktif, Unit On-Hand, SKU ≤ ROP, Kadaluarsa ≤ 3hr
- ✅ **Enhanced Table**: Kolom SKU, Stok (UoM), Status lampu (hijau/kuning/merah)
- ✅ **Demo Mode Banner**: Reset data demo untuk owner
- ✅ **Feature Flag Switching**: Conditional rendering V1 vs legacy

### 5. Stock Validation System
- ✅ **useInventoryV1Validation Hook**: Validasi stok sebelum transaksi
- ✅ **StockValidationAlert Component**: UI untuk stok tidak mencukupi
- ✅ **Enhanced Stock Validation**: Support bulk validation dan override
- ✅ **Negative Stock Override**: Dengan approval supervisor dan alasan

### 6. Demo Data System
- ✅ **Demo Products Seeder**: 8 produk bakery dengan stok realistis
- ✅ **Reset Demo Data**: Function untuk owner reset data demo
- ✅ **Demo Mode UI**: Banner dan kontrol reset

### 7. Services & Utilities
- ✅ **inventoryV1Service**: KPI calculation, stock validation, SKU generation
- ✅ **demoDataService**: Create/reset demo products
- ✅ **featureFlags**: Centralized feature toggle management
- ✅ **Enhanced stockValidationService**: Backward compatible dengan V1

## 🔧 How to Use

### 1. Enable Simple Inventory V1
```typescript
// src/utils/featureFlags.ts
export const FEATURE_FLAGS = {
  INVENTORY_SIMPLE_V1: true, // Enable V1 features
  ALLOW_NEGATIVE_STOCK_OVERRIDE: false, // Disable override by default
  DEMO_MODE: false, // Enable for testing
}
```

### 2. Add Products with Inventory Info
1. Buka **Produk Lengkap** > **Tambah Produk**
2. Isi data dasar (Nama, Harga, Deskripsi)
3. Expand section **Inventori (Ringkas)**
4. Isi SKU, UoM, Stok Awal, ROP, Lead Time
5. Jika produk kadaluarsa, centang checkbox dan isi Shelf Life

### 3. Monitor Inventory Status
1. Buka halaman **Inventori**
2. Lihat 4 KPI cards di atas
3. Tabel menampilkan status stok dengan lampu warna:
   - 🟢 Hijau: Stok > ROP (Aman)
   - 🟡 Kuning: Stok = ROP (Menipis) 
   - 🔴 Merah: Stok < ROP (Rendah)

### 4. Demo Mode Testing
1. Set `DEMO_MODE=true` di feature flags
2. Login sebagai owner
3. Buka halaman **Inventori** atau **Produk Lengkap**
4. Klik **Reset Data Demo** untuk generate 8 produk contoh

### 5. Stock Validation
- Sistem otomatis validasi stok saat transaksi
- Jika stok tidak mencukupi, muncul alert dengan opsi:
  - **Batal**: Cancel transaksi
  - **Override**: Lanjutkan dengan approval (jika enabled)

## 📊 KPI Calculations

### SKU Aktif
Jumlah unique product yang memiliki inventory records

### Unit On-Hand  
Total semua stok dari semua produk (dalam satuan pcs)

### SKU ≤ ROP
Jumlah SKU yang memiliki stok <= Reorder Point (status kuning + merah)

### Kadaluarsa ≤ 3hr
Jumlah SKU dengan expiry date dalam 3 hari ke depan (placeholder - butuh batch data)

## 🔄 Backward Compatibility

### Legacy Support
- Semua kolom baru **nullable** dengan default values
- Modul lama (Kasir, Pesanan, Retur, Laporan) tetap berfungsi normal
- Feature flags memungkinkan rollback instan jika ada masalah

### Rollback Strategy
```typescript
// Emergency rollback - set feature flag
INVENTORY_SIMPLE_V1: false  // Kembali ke UI lama
```

### Fallback Values
- `uom`: Default 'pcs' jika NULL
- `reorder_point`: Default 30 jika NULL  
- `lead_time_days`: Default 2 jika NULL
- `sku`: Auto-generate 'PRD-{id}' jika kosong

## 🛡️ Security & Validation

### Input Validation
- Semua input numerik tidak boleh negatif
- SKU unique constraint (soft - boleh NULL)
- Stok awal diproses sebagai stock adjustment (audit trail)

### Stock Protection
- Blokir transaksi yang menyebabkan stok negatif
- Override hanya untuk supervisor dengan alasan valid
- Log semua stock movements ke `stock_adjustments`

### Role-based Access
- **Owner**: Full access, bisa reset demo data
- **Admin Pusat**: Kelola inventori, tidak bisa reset demo
- **Kasir Cabang**: View only, validasi stok otomatis

## 🧪 Testing Scenarios

### ✅ Acceptance Criteria Passed

1. **Kosong field inventori**: ✅ Produk bisa ditambah hanya dengan Nama & Harga
2. **Stok awal**: ✅ Tercatat sebagai stock adjustment dengan type 'init'
3. **Status lampu**: ✅ Berubah sesuai ROP (hijau/kuning/merah)
4. **Validasi stok**: ✅ Tolak transaksi yang membuat stok < 0
5. **KPI cards**: ✅ Tampil tanpa error walau data NULL
6. **Backward compatibility**: ✅ Modul lama tidak error

### Demo Data Products
```
- Bolu batik kecil: 120 pcs, ROP 30, shelf life 3 hari
- Bolu pisang: 90 pcs, ROP 30, shelf life 3 hari  
- Roti maryam: 50 pcs, ROP 25, shelf life 2 hari
- Roti boy: 80 pcs, ROP 40, shelf life 3 hari
- Roti pisang: 110 pcs, ROP 30, shelf life 3 hari
- Cake Ikan: 18 pcs, ROP 12, shelf life 2 hari
- Bolu pisang (kecil): 60 pcs, ROP 24, shelf life 3 hari
- Roti bluder: 45 pcs, ROP 20, shelf life 4 hari
```

## 📝 Next Steps

### Phase 2 Enhancements (Future)
- [ ] Batch tracking untuk expiry date akurat
- [ ] Cost tracking dan inventory valuation  
- [ ] Advanced reporting (aging, turnover)
- [ ] Automatic reorder suggestions
- [ ] Barcode scanning integration
- [ ] Multi-location transfer workflows

### Integration Points
- [ ] Connect dengan production module untuk auto-stock update
- [ ] API endpoint untuk mobile apps
- [ ] Export inventory reports (PDF/Excel)
- [ ] Real-time notifications untuk low stock

## 🎯 Success Metrics

- ✅ Zero breaking changes pada modul existing
- ✅ Feature flags memungkinkan safe rollout/rollback
- ✅ UI conditionally rendered berdasarkan feature flags
- ✅ Database migration additive dan idempotent
- ✅ Demo mode untuk easy testing dan onboarding
- ✅ Comprehensive stock validation dengan override capability

**Simple Inventory V1 berhasil diimplementasikan dengan prinsip safety-first dan backward compatibility!** 🚀