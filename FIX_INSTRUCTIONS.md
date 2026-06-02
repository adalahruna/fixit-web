# 🔧 Instruksi Perbaikan: Dashboard Mekanik Status In Progress

## Masalah yang Ditemukan

Dari debug info, saya menemukan:
- ✅ Mechanic ID: `650e8400-e29b-41d4-a716-446655440001`
- ✅ User ID: `09c45ae1-5113-4964-8900-952f94113872`
- ✅ Ada 12 assignments
- ❌ **SEMUA bookings masih status `confirmed`, TIDAK ADA yang `in_progress`**

**Root Cause:** Ketika klik "Mulai Servis", atomic function `start_service_atomic` gagal mengupdate status karena kemungkinan:
1. Record `service_progress` tidak ada untuk booking tersebut
2. Status `service_progress` bukan `queued` (harus `queued` agar bisa diupdate ke `in_progress`)

## Solusi: Jalankan Script Perbaikan

### Langkah 1: Cek Status Service Progress

Jalankan di Supabase SQL Editor:

```sql
-- File: database/scripts/check-service-progress-status.sql

SELECT 
  b.id as booking_id,
  b.status as booking_status,
  sp.status as service_progress_status,
  sp.start_time,
  CASE 
    WHEN sp.booking_id IS NULL THEN '❌ SERVICE_PROGRESS TIDAK ADA'
    WHEN sp.status != 'queued' AND sp.start_time IS NULL THEN '⚠️ STATUS BUKAN QUEUED'
    WHEN b.status != sp.status THEN '❌ STATUS TIDAK KONSISTEN'
    ELSE '✅ OK'
  END as status_check
FROM assignments a
JOIN bookings b ON b.id = a.booking_id
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE a.mechanic_id = '650e8400-e29b-41d4-a716-446655440001'
ORDER BY a.queue_position;
```

**Screenshot hasil query ini dan kirim ke saya.**

### Langkah 2: Jalankan Script Perbaikan

Jalankan di Supabase SQL Editor:

```sql
-- File: database/scripts/fix-confirmed-bookings.sql

-- Step 1: Create missing service_progress records
INSERT INTO service_progress (booking_id, status)
SELECT b.id, 'queued'
FROM bookings b
JOIN assignments a ON a.booking_id = b.id
WHERE b.status = 'confirmed'
  AND NOT EXISTS (
    SELECT 1 FROM service_progress sp 
    WHERE sp.booking_id = b.id
  );

-- Step 2: Fix service_progress status to 'queued' for confirmed bookings
UPDATE service_progress sp
SET status = 'queued',
    start_time = NULL,
    end_time = NULL
FROM bookings b
WHERE sp.booking_id = b.id
  AND b.status = 'confirmed'
  AND sp.status != 'queued';

-- Step 3: Verify results
SELECT 
  COUNT(*) as total_confirmed_bookings,
  COUNT(sp.booking_id) as has_service_progress,
  COUNT(CASE WHEN sp.status = 'queued' THEN 1 END) as queued_status
FROM bookings b
JOIN assignments a ON a.booking_id = b.id
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'confirmed';
```

**Screenshot hasil Step 3 (verify results).**

### Langkah 3: Test Klik "Mulai Servis"

1. **Refresh dashboard mekanik** (Ctrl+Shift+R)
2. **Buka halaman queue** (`/mechanic/queue`)
3. **Pilih salah satu booking** dan klik "Mulai Servis"
4. **Cek terminal** - harus ada log:
   ```
   🔧 Starting service: { bookingId: '...', userId: '...' }
   📊 Start service result: { success: true }
   ✅ Service started successfully, paths revalidated
   ```
5. **Refresh dashboard** - counter "Sedang Dikerjakan" harus bertambah

### Langkah 4: Verifikasi di Database

Jalankan query ini untuk memastikan status berubah:

```sql
SELECT 
  b.id as booking_id,
  b.status as booking_status,
  sp.status as service_progress_status,
  sp.start_time,
  m.name as mechanic_name
FROM bookings b
JOIN assignments a ON a.booking_id = b.id
JOIN mechanics m ON m.id = a.mechanic_id
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'in_progress'
ORDER BY sp.start_time DESC;
```

**Harus ada row dengan status `in_progress` dan `start_time` yang baru.**

## Jika Masih Gagal

Jika setelah Langkah 2 masih gagal, cek error di terminal:

1. Lihat log `❌ Start service RPC error:` atau `❌ Start service function error:`
2. Screenshot error tersebut
3. Kirim ke saya untuk analisis lebih lanjut

## Kemungkinan Error dan Solusi

### Error: "Service progress not found or not in queued status"
**Penyebab:** Record service_progress tidak ada atau statusnya bukan `queued`
**Solusi:** Jalankan ulang Langkah 2 (fix script)

### Error: "Assignment not found"
**Penyebab:** Booking tidak di-assign ke mechanic yang login
**Solusi:** Admin harus assign booking ke mechanic ini dulu

### Error: "Mechanic not found for user"
**Penyebab:** User tidak ter-link dengan mechanic
**Solusi:** Jalankan script link mechanic-user

## Expected Result

Setelah perbaikan berhasil:
- ✅ Klik "Mulai Servis" berhasil tanpa error
- ✅ Status di database berubah ke `in_progress`
- ✅ Dashboard menampilkan counter "Sedang Dikerjakan" = 1 (atau lebih)
- ✅ Log di terminal menunjukkan `✅ Service started successfully`

## File yang Sudah Diupdate

1. `frontend/src/lib/progress/actions.ts` - Added detailed logging
2. `database/scripts/check-service-progress-status.sql` - Check script
3. `database/scripts/fix-confirmed-bookings.sql` - Fix script
4. `FIX_INSTRUCTIONS.md` - This file

## Next Steps

Setelah Anda jalankan script perbaikan dan test:
1. Screenshot hasil Langkah 1 (check status)
2. Screenshot hasil Langkah 2 Step 3 (verify)
3. Screenshot dashboard setelah klik "Mulai Servis"
4. Copy-paste log dari terminal

Kirim semua ke saya untuk verifikasi final! 🚀
