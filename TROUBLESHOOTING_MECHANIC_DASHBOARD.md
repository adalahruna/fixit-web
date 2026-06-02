# Troubleshooting: Dashboard Mekanik Status "Sedang Dikerjakan" Selalu 0

## Masalah
Setelah mekanik klik "Mulai Servis", angka "Sedang Dikerjakan" di dashboard tetap 0.

## Root Cause
Ada beberapa kemungkinan penyebab:

### 1. Migration 007 Belum Dijalankan
Atomic functions `start_service_atomic` dan `complete_service_atomic` belum dibuat di database.

**Solusi:**
```sql
-- Jalankan di Supabase SQL Editor
-- File: database/migrations/007_atomic_status_functions.sql
-- Atau gunakan script: database/scripts/run-migration-007.sql
```

### 2. Data Tidak Konsisten
Booking memiliki `service_progress.start_time` tapi status masih `queued`.

**Solusi:**
```sql
-- Jalankan script perbaikan
-- File: database/scripts/fix-in-progress-status.sql
```

### 3. RLS Policy Blocking
Row Level Security policy memblokir update status.

**Cek RLS:**
```sql
-- Lihat RLS policies untuk bookings
SELECT * FROM pg_policies WHERE tablename = 'bookings';

-- Lihat RLS policies untuk service_progress  
SELECT * FROM pg_policies WHERE tablename = 'service_progress';
```

### 4. Mechanic Tidak Ter-link dengan User
Mechanic tidak punya `user_id` yang sesuai dengan user yang login.

**Cek Data:**
```sql
-- Cek relasi mechanic-user
SELECT 
  m.id as mechanic_id,
  m.name as mechanic_name,
  m.user_id,
  u.id as user_id,
  u.name as user_name,
  u.email
FROM mechanics m
LEFT JOIN users u ON m.user_id = u.id
WHERE u.role = 'mechanic';
```

## Langkah Troubleshooting

### Step 1: Verifikasi Atomic Functions Ada
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('start_service_atomic', 'complete_service_atomic');
```

**Expected Result:** 2 rows (kedua function ada)

**Jika kosong:** Jalankan `database/migrations/007_atomic_status_functions.sql`

### Step 2: Test Atomic Function Manually
```sql
-- Ganti dengan booking_id dan user_id yang sebenarnya
SELECT start_service_atomic(
  'BOOKING_ID_HERE'::uuid,
  'USER_ID_HERE'::uuid
);
```

**Expected Result:** `{"success": true}`

**Jika error:** Lihat error message untuk debugging

### Step 3: Cek Data Setelah Klik "Mulai Servis"
```sql
-- Ganti dengan booking_id yang diklik
SELECT 
  b.id,
  b.status as booking_status,
  sp.status as progress_status,
  sp.start_time,
  sp.end_time
FROM bookings b
LEFT JOIN service_progress sp ON b.id = sp.booking_id
WHERE b.id = 'BOOKING_ID_HERE';
```

**Expected Result:**
- `booking_status` = `'in_progress'`
- `progress_status` = `'in_progress'`
- `start_time` = timestamp (not null)
- `end_time` = null

### Step 4: Cek Dashboard Query
```sql
-- Ganti dengan mechanic_id yang sebenarnya
SELECT 
  b.id,
  b.status,
  sp.status as progress_status
FROM assignments a
JOIN bookings b ON a.booking_id = b.id
LEFT JOIN service_progress sp ON b.id = sp.booking_id
WHERE a.mechanic_id = 'MECHANIC_ID_HERE'
AND b.status = 'in_progress';
```

**Expected Result:** Harus ada row dengan status `in_progress`

## Quick Fix Script

Jalankan script ini di Supabase SQL Editor untuk memperbaiki semua masalah sekaligus:

```sql
-- 1. Fix inconsistent data
UPDATE bookings b
SET status = 'in_progress'
FROM service_progress sp
WHERE b.id = sp.booking_id
AND sp.start_time IS NOT NULL
AND sp.end_time IS NULL
AND b.status != 'in_progress';

UPDATE service_progress
SET status = 'in_progress'
WHERE start_time IS NOT NULL
AND end_time IS NULL
AND status != 'in_progress';

-- 2. Verify results
SELECT 
  COUNT(*) as in_progress_count,
  'bookings' as table_name
FROM bookings 
WHERE status = 'in_progress'
UNION ALL
SELECT 
  COUNT(*) as in_progress_count,
  'service_progress' as table_name
FROM service_progress 
WHERE status = 'in_progress';
```

## Testing Checklist

- [ ] Migration 007 sudah dijalankan
- [ ] Atomic functions ada di database
- [ ] Mechanic ter-link dengan user (user_id tidak null)
- [ ] RLS policies tidak memblokir update
- [ ] Klik "Mulai Servis" berhasil (tidak ada error)
- [ ] Status di database berubah ke `in_progress`
- [ ] Dashboard menampilkan angka yang benar setelah refresh

## File Terkait

- `database/migrations/007_atomic_status_functions.sql` - Atomic functions
- `database/scripts/run-migration-007.sql` - Script untuk run migration
- `database/scripts/fix-in-progress-status.sql` - Script perbaikan data
- `frontend/src/lib/progress/actions.ts` - Start/complete service actions
- `frontend/src/app/mechanic/page.tsx` - Dashboard mekanik
- `frontend/src/components/progress/ServiceActionButtons.tsx` - Tombol mulai/selesai

## Kontak

Jika masalah masih berlanjut setelah mengikuti semua langkah di atas, kemungkinan ada issue dengan:
1. Supabase connection
2. Authentication/authorization
3. Browser cache (coba hard refresh: Ctrl+Shift+R)
