# Fix: KPI Average Time Showing 0 Minutes

## Problem
KPI dashboard menunjukkan 0 menit untuk average service time, padahal sudah ada 4 booking yang selesai.

## Root Cause
Booking lama yang sudah selesai tidak memiliki `actual_duration` yang terisi. Hanya booking baru (setelah atomic function diperbaiki) yang otomatis menghitung `actual_duration`.

KPI calculation memfilter booking yang tidak punya `actual_duration`:
```typescript
const completedWithProgress = bookings?.filter(b => 
  b.status === 'done' && 
  b.service_progress && 
  Array.isArray(b.service_progress) && 
  b.service_progress[0]?.actual_duration  // ← Booking tanpa actual_duration di-skip
) || [];
```

## Solution

### Jalankan Script Fix
1. Buka **Supabase SQL Editor**
2. Copy-paste isi file: `database/scripts/FIX_AVG_TIME_ONLY.sql`
3. Run script tersebut

Script akan:
1. ✅ Cek berapa booking yang missing `actual_duration`
2. ✅ Tampilkan booking mana saja yang perlu di-fix
3. ✅ Backfill `actual_duration` dengan menghitung dari `end_time - start_time`
4. ✅ Verifikasi hasil fix
5. ✅ Tampilkan semua completed bookings dengan duration

### Expected Output
```
📊 Current State Check
- total_done_bookings: 4
- bookings_with_duration: 0 (atau kurang dari 4)
- bookings_missing_duration: 4 (atau lebih dari 0)

✅ After Fix
- total_done_bookings: 4
- bookings_with_duration: 4
- bookings_still_missing: 0
- new_avg_duration: (nilai rata-rata dalam menit)
```

### Test
Setelah run script:
1. Buka **Admin KPI Dashboard**
2. Avg time seharusnya menunjukkan nilai yang benar (bukan 0 menit)
3. Nilai akan dihitung dari semua booking yang sudah selesai

## Technical Details

### Calculation Formula
```sql
actual_duration = EXTRACT(EPOCH FROM (end_time - start_time)) / 60
```
- `EXTRACT(EPOCH FROM ...)` = convert interval ke detik
- `/ 60` = convert detik ke menit

### Why This Happens
Atomic function `complete_service_atomic` sekarang sudah menghitung `actual_duration` otomatis:
```sql
v_actual_duration := EXTRACT(EPOCH FROM (NOW() - v_start_time)) / 60;

UPDATE service_progress 
SET 
  status = 'done',
  end_time = NOW(),
  actual_duration = v_actual_duration  -- ← Ini baru ditambahkan
WHERE booking_id = p_booking_id;
```

Tapi booking yang sudah selesai SEBELUM fix ini tidak punya `actual_duration`, jadi perlu di-backfill.

## Files
- `database/scripts/FIX_AVG_TIME_ONLY.sql` - Script untuk backfill actual_duration
