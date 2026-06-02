# Fitur Prioritas Booking

## Deskripsi
Fitur prioritas booking memungkinkan admin untuk mengatur tingkat prioritas setiap booking, yang akan mempengaruhi urutan antrian di dashboard mekanik.

## Level Prioritas

1. **🔥 Urgent (Priority 1)** - Untuk booking yang sangat mendesak
2. **⚡ High (Priority 2)** - Untuk booking dengan prioritas tinggi
3. **📋 Normal (Priority 3)** - Level prioritas default
4. **📌 Low (Priority 4)** - Untuk booking dengan prioritas rendah

## Fitur Yang Ditambahkan

### 1. Database Migration
- **File**: `database/migrations/012_add_booking_priority.sql`
- Menambahkan kolom `priority` INTEGER dengan default value 3 (Normal)
- Menambahkan index untuk performa sorting

### 2. Komponen PrioritySelector
- **File**: `frontend/src/components/bookings/PrioritySelector.tsx`
- Komponen untuk admin mengubah prioritas booking
- Visual dengan warna berbeda untuk setiap level prioritas
- Real-time update dengan feedback sukses/error

### 3. Filter Prioritas
- **File**: `frontend/src/components/bookings/BookingFilters.tsx`
- Tambahan dropdown filter untuk memilih prioritas
- Dapat dikombinasikan dengan filter lain (status, tanggal, dll)

### 4. Antrian Mekanik dengan Prioritas
- **File**: `frontend/src/app/mechanic/queue/page.tsx`
- Sorting antrian berdasarkan:
  1. Prioritas (lebih tinggi = muncul di atas)
  2. Queue position (untuk booking dengan prioritas sama)
- Menampilkan badge prioritas di setiap card booking
- Filter prioritas di halaman antrian

### 5. Admin Bookings List
- **File**: `frontend/src/app/admin/bookings/page.tsx`
- Menampilkan badge prioritas di tabel booking
- Badge muncul di bawah badge status

### 6. Admin Booking Detail
- **File**: `frontend/src/app/admin/bookings/[id]/page.tsx`
- Sidebar PrioritySelector untuk mengubah prioritas
- Visual interaktif dengan button untuk setiap level prioritas
- Menampilkan informasi tentang dampak prioritas ke antrian

## Cara Menggunakan

### Untuk Admin
1. Buka detail booking di `/admin/bookings/[id]`
2. Di sidebar kanan atas, akan ada section "Prioritas Booking"
3. Klik salah satu button prioritas (Urgent, High, Normal, atau Low)
4. Prioritas akan langsung terupdate dan mempengaruhi urutan antrian mekanik

### Untuk Mekanik
1. Buka halaman antrian di `/mechanic/queue`
2. Booking akan otomatis tersortir berdasarkan prioritas
3. Badge prioritas akan muncul di setiap card booking
4. Bisa menggunakan filter prioritas untuk melihat booking tertentu

## Aturan Prioritas

1. **Urgent (1)** - Muncul paling atas di antrian
   - Untuk servis darurat
   - Motor mogok total
   - Customer VIP dengan kebutuhan mendesak

2. **High (2)** - Prioritas tinggi
   - Servis penting yang perlu segera diselesaikan
   - Motor dengan masalah safety-critical

3. **Normal (3)** - Default untuk semua booking
   - Servis rutin dan regular
   - Maintenance terjadwal

4. **Low (4)** - Prioritas rendah
   - Servis yang bisa ditunda
   - Booking fleksibel dengan waktu luang

## Database Schema

```sql
ALTER TABLE bookings 
ADD COLUMN priority INTEGER DEFAULT 3 CHECK (priority IN (1, 2, 3, 4));

CREATE INDEX idx_bookings_priority ON bookings(priority);
```

## Run Migration

Jalankan migration dengan:

```sql
\i database/migrations/012_add_booking_priority.sql;
```

Atau via Supabase SQL Editor, copy paste isi file:
```
database/scripts/run-migration-012.sql
```

## Testing

### Test Case 1: Update Priority
1. Login sebagai admin
2. Buka booking detail
3. Ubah prioritas dari Normal ke Urgent
4. Verify: Priority badge berubah warna merah dengan icon 🔥
5. Verify: Database terupdate dengan priority = 1

### Test Case 2: Sorting di Antrian Mekanik
1. Buat 3 booking dengan prioritas berbeda (Urgent, Normal, Low)
2. Assign semua ke mekanik yang sama
3. Login sebagai mekanik tersebut
4. Buka halaman antrian
5. Verify: Booking Urgent muncul paling atas, diikuti Normal, lalu Low

### Test Case 3: Filter Prioritas
1. Login sebagai mekanik
2. Buka halaman antrian
3. Pilih filter "Urgent" dari dropdown prioritas
4. Verify: Hanya booking dengan prioritas Urgent yang muncul

## Impact & Benefit

### Untuk Admin
- Lebih mudah mengatur prioritas servis berdasarkan urgensi
- Visual yang jelas untuk membedakan tingkat prioritas
- Kontrol penuh terhadap urutan antrian mekanik

### Untuk Mekanik
- Lebih jelas booking mana yang harus dikerjakan duluan
- Tidak bingung menentukan prioritas kerja
- Efisiensi waktu lebih baik

### Untuk Customer
- Booking urgent bisa lebih cepat ditangani
- Service level yang lebih baik untuk kasus darurat

## Future Improvement

1. **Auto Priority**: Otomatis set priority berdasarkan:
   - Tipe servis (emergency = urgent)
   - Customer tier (VIP = high)
   - Waktu tunggu (lama menunggu = naik priority)

2. **Priority History**: Log perubahan prioritas untuk audit

3. **Notification**: Notifikasi ke mekanik ketika ada booking urgent baru

4. **SLA Integration**: Prioritas mempengaruhi SLA tolerance time

## Notes

- Default priority adalah 3 (Normal) untuk backward compatibility
- Booking lama yang belum ada priority akan otomatis dapat priority 3
- Priority bisa diubah kapan saja selama booking belum selesai
- Perubahan priority akan langsung terlihat di antrian mekanik (real-time)
