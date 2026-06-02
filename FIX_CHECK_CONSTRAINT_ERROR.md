# Fix untuk Error: service_progress_status_check

## Error yang Terjadi

```
ERROR: 23514: new row for relation "service_progress" violates check constraint "service_progress_status_check"
DETAIL: Failing row contains (..., confirmed, ...)
```

## Root Cause

Tabel `service_progress` dan `bookings` punya **status values yang berbeda**:

### Bookings Table
- `pending` - Booking baru, belum di-assign
- `confirmed` - Sudah di-assign ke mechanic
- `in_progress` - Sedang dikerjakan
- `done` - Selesai
- `cancelled` - Dibatalkan

### Service Progress Table (CHECK CONSTRAINT)
- `queued` - Menunggu dikerjakan
- `in_progress` - Sedang dikerjakan
- `done` - Selesai

**Masalah:** Trigger lama mencoba sync status 1:1, tapi `confirmed` tidak valid untuk `service_progress`!

## Solusi

Script `PERMANENT_FIX.sql` sudah diperbaiki dengan **status mapping yang benar**:

### Mapping Rules

**Dari bookings → service_progress:**
- `confirmed` → `queued` ✅
- `in_progress` → `in_progress` ✅
- `done` → `done` ✅
- `pending` → (tidak ada service_progress record)
- `cancelled` → (tidak ada service_progress record)

**Dari service_progress → bookings:**
- `queued` → `queued` (tidak diubah, karena bookings sudah `confirmed`)
- `in_progress` → `in_progress` ✅
- `done` → `done` ✅

## Yang Sudah Diperbaiki

1. **Step 1 (Data Cleanup)** - Sekarang pakai CASE statement untuk mapping yang benar
2. **Step 3 (Trigger)** - Sekarang pakai IF-ELSIF untuk translate status dengan benar

## Cara Menjalankan

Sekarang bisa run `PERMANENT_FIX.sql` tanpa error:

```sql
-- Copy paste seluruh isi file database/scripts/PERMANENT_FIX.sql
-- ke Supabase SQL Editor dan run
```

Script akan:
1. ✅ Bersihkan data dengan mapping yang benar
2. ✅ Update functions
3. ✅ Create triggers dengan mapping yang benar

## Verifikasi

Setelah run, check dengan:

```sql
-- Pastikan tidak ada error constraint
SELECT 
  sp.booking_id,
  b.status as booking_status,
  sp.status as progress_status,
  CASE 
    WHEN b.status = 'confirmed' AND sp.status != 'queued' THEN '❌ Should be queued'
    WHEN b.status = 'in_progress' AND sp.status != 'in_progress' THEN '❌ Should be in_progress'
    WHEN b.status = 'done' AND sp.status != 'done' THEN '❌ Should be done'
    ELSE '✅ OK'
  END as validation
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status IN ('confirmed', 'in_progress', 'done');
```

Expected: Semua row harus `✅ OK`
