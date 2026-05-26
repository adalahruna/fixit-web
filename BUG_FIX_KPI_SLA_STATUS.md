# Bug Fix: KPI/SLA Data dan Status Badge Mekanik

## Tanggal: 26 Mei 2026

## Bug yang Diperbaiki

### 1. Booking yang Sudah Selesai Tidak Masuk ke KPI/SLA

**Masalah:**
- Booking yang sudah selesai (status `done`) tidak muncul di dashboard KPI dan SLA monitoring
- Data yang ditampilkan tidak lengkap

**Penyebab:**
- Query di `frontend/src/lib/kpi/calculations.ts` menggunakan filter `created_at` (tanggal booking dibuat)
- Ini menyebabkan booking yang dibuat sebelum periode filter tidak muncul, meskipun selesai dalam periode tersebut
- Contoh: Booking dibuat tanggal 1 Mei, selesai tanggal 20 Mei. Jika filter 15-25 Mei, booking ini tidak muncul karena `created_at` di luar range

**Solusi:**
- Mengubah filter dari `created_at` ke `schedule_start` (tanggal jadwal servis)
- Sekarang semua booking yang dijadwalkan dalam periode filter akan muncul, termasuk yang sudah selesai
- File yang diubah: `frontend/src/lib/kpi/calculations.ts` baris 68-70

**Perubahan Kode:**
```typescript
// SEBELUM (salah):
.gte('created_at', start.toISOString())
.lte('created_at', end.toISOString())

// SESUDAH (benar):
.gte('schedule_start', start.toISOString())
.lte('schedule_start', end.toISOString())
```

### 2. Status Badge "Sedang Dikerjakan" di Dashboard Mekanik Tidak Update

**Masalah:**
- Ketika mekanik mulai mengerjakan servis (klik "Mulai Servis"), angka "Sedang Dikerjakan" di dashboard tetap 0
- Status badge tidak menghitung booking dengan status `in_progress` dengan benar

**Penyebab:**
- Query menggunakan join yang kompleks dengan `assignments!inner(*)` yang tidak efisien
- Join tidak memperhitungkan relasi yang benar antara bookings dan assignments
- Query tidak mengambil data dengan cara yang tepat

**Solusi:**
- Mengubah logika query menjadi 2 langkah:
  1. Ambil semua `booking_id` dari assignments untuk mechanic tersebut
  2. Query bookings berdasarkan list `booking_id` dan filter status
- Ini lebih akurat dan efisien
- File yang diubah: `frontend/src/app/mechanic/page.tsx` baris 32-62

**Perubahan Kode:**
```typescript
// SEBELUM (salah):
const { count: inProgress } = await supabase
  .from('bookings')
  .select('*, assignments!inner(*)', { count: 'exact', head: true })
  .eq('assignments.mechanic_id', mechanic.id)
  .eq('status', 'in_progress');

// SESUDAH (benar):
// 1. Get all booking IDs for this mechanic
const { data: assignments } = await supabase
  .from('assignments')
  .select('booking_id')
  .eq('mechanic_id', mechanic.id);

const bookingIds = assignments?.map(a => a.booking_id) || [];

// 2. Count in_progress bookings
const { count: inProgress } = await supabase
  .from('bookings')
  .select('*', { count: 'exact', head: true })
  .in('id', bookingIds)
  .eq('status', 'in_progress');
```

### 3. Revalidation Path untuk Dashboard KPI dan SLA

**Masalah:**
- Dashboard KPI dan SLA tidak ter-refresh otomatis saat status booking berubah

**Solusi:**
- Menambahkan revalidation path untuk `/admin/dashboard` dan `/admin/sla`
- File yang diubah: `frontend/src/lib/utils/revalidation.ts`

**Perubahan Kode:**
```typescript
export function revalidateBookingPaths(bookingId: string) {
  // Admin paths
  revalidatePath('/admin/bookings');
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath('/admin/dashboard'); // ← DITAMBAHKAN
  revalidatePath('/admin/sla');       // ← DITAMBAHKAN
  
  // ... rest of paths
}
```

## Cara Testing

### Test Bug 1 (KPI/SLA Data):
1. Buat booking dengan jadwal hari ini
2. Assign ke mekanik
3. Mekanik mulai dan selesaikan servis
4. Buka halaman KPI Dashboard (`/admin/dashboard`)
5. Buka halaman SLA Monitoring (`/admin/sla`)
6. **Verifikasi:** Booking yang sudah selesai muncul di data KPI dan SLA

### Test Bug 2 (Status Badge Mekanik):
1. Login sebagai mekanik
2. Buka dashboard mekanik (`/mechanic`)
3. Lihat angka "Sedang Dikerjakan" (misalnya: 0)
4. Buka halaman queue (`/mechanic/queue`)
5. Klik "Mulai Servis" pada salah satu booking
6. Kembali ke dashboard mekanik
7. **Verifikasi:** Angka "Sedang Dikerjakan" bertambah 1 (refresh halaman jika perlu)

### Test Bug 3 (Revalidation):
1. Buka dashboard admin KPI di satu tab
2. Buka halaman mechanic queue di tab lain
3. Mulai atau selesaikan servis
4. Refresh dashboard admin KPI
5. **Verifikasi:** Data ter-update dengan benar

## File yang Diubah

1. `frontend/src/lib/kpi/calculations.ts`
   - Mengubah filter query dari `created_at` ke `schedule_start`
   - Menambahkan field `name` di service_types untuk konsistensi

2. `frontend/src/lib/utils/revalidation.ts`
   - Menambahkan revalidation path untuk `/admin/dashboard`
   - Menambahkan revalidation path untuk `/admin/sla`

3. `frontend/src/app/mechanic/page.tsx`
   - Mengubah query untuk "Total Antrian" menjadi hanya menghitung booking dengan status `queued`
   - Mengubah query untuk "Sedang Dikerjakan" menggunakan 2-step query (assignments → bookings)
   - Mengubah query untuk "Selesai Hari Ini" menggunakan filter tanggal yang lebih akurat

## Dampak

### Positif:
- ✅ Data KPI dan SLA sekarang lengkap dan akurat
- ✅ Dashboard mekanik menampilkan angka yang benar untuk "Sedang Dikerjakan"
- ✅ Dashboard mekanik menampilkan angka yang benar untuk "Total Antrian" (hanya queued)
- ✅ Dashboard mekanik menampilkan angka yang benar untuk "Selesai Hari Ini"
- ✅ Admin bisa melihat semua booking yang selesai dalam periode yang dipilih
- ✅ Monitoring SLA lebih akurat karena data lengkap
- ✅ Query lebih efisien dan mudah dipahami

### Perlu Diperhatikan:
- Filter date range di KPI Dashboard sekarang berdasarkan `schedule_start`, bukan `created_at`
- Jika ingin melihat booking berdasarkan tanggal pembuatan, perlu fitur filter tambahan
- Dashboard mekanik mungkin perlu refresh manual untuk melihat update (ini behavior normal Next.js server components)

## Status
✅ **SELESAI** - Semua bug sudah diperbaiki dan siap untuk testing
