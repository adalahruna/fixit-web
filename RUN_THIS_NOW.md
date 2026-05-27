# 🚨 URGENT FIX - Run Ini Sekarang!

## Masalah yang Ditemukan

Dari data database kamu:
```
booking_status: confirmed | progress_status: done | actual_duration: null ❌
booking_status: in_progress | progress_status: done | actual_duration: null ❌
```

**2 MASALAH KRITIS:**
1. ❌ `actual_duration = null` → Function belum calculate duration
2. ❌ Status tidak sinkron → `booking_status` tidak match `progress_status`

## Root Cause

Function `complete_service_atomic` di Supabase **BELUM di-update**! Masih pakai versi lama yang tidak calculate `actual_duration`.

## Solusi - 3 Langkah

### Langkah 1: Update Function (WAJIB!)

Buka Supabase SQL Editor, copy-paste script ini, lalu RUN:

**File: `database/scripts/FIX_ACTUAL_DURATION.sql`**

```sql
-- CRITICAL FIX: Update complete_service_atomic to calculate actual_duration
-- Run this in Supabase SQL Editor NOW!

-- Drop old function first
DROP FUNCTION IF EXISTS complete_service_atomic(UUID, UUID);

-- Create new function with actual_duration calculation
CREATE OR REPLACE FUNCTION complete_service_atomic(
  p_booking_id UUID,
  p_mechanic_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_mechanic_id UUID;
  v_assignment_exists BOOLEAN;
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_actual_duration INTEGER;
  v_result JSON;
BEGIN
  -- Get mechanic ID from user_id
  SELECT id INTO v_mechanic_id 
  FROM mechanics 
  WHERE user_id = p_mechanic_user_id;
  
  IF v_mechanic_id IS NULL THEN
    RETURN json_build_object('error', 'Mechanic not found for user');
  END IF;
  
  -- Check if assignment exists
  SELECT EXISTS(
    SELECT 1 FROM assignments 
    WHERE booking_id = p_booking_id AND mechanic_id = v_mechanic_id
  ) INTO v_assignment_exists;
  
  IF NOT v_assignment_exists THEN
    RETURN json_build_object('error', 'Assignment not found');
  END IF;
  
  -- Get start_time to calculate duration
  SELECT start_time INTO v_start_time
  FROM service_progress
  WHERE booking_id = p_booking_id AND status = 'in_progress';
  
  IF v_start_time IS NULL THEN
    RETURN json_build_object('error', 'Service progress not found or not in progress');
  END IF;
  
  -- Calculate actual duration in minutes
  v_actual_duration := EXTRACT(EPOCH FROM (NOW() - v_start_time)) / 60;
  
  -- Atomic update: both tables in single transaction
  UPDATE service_progress 
  SET 
    status = 'done',
    end_time = NOW(),
    actual_duration = v_actual_duration
  WHERE booking_id = p_booking_id AND status = 'in_progress';
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Service progress not found or not in progress');
  END IF;
  
  UPDATE bookings 
  SET status = 'done', updated_at = NOW()
  WHERE id = p_booking_id;
  
  RETURN json_build_object('success', true, 'actual_duration', v_actual_duration);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_service_atomic(UUID, UUID) TO authenticated;

-- Verify function was created
SELECT 'Function complete_service_atomic updated successfully!' as status;
```

**Expected Output:** `Function complete_service_atomic updated successfully!`

---

### Langkah 2: Fix Data yang Rusak

Setelah function di-update, fix data yang sudah rusak:

**File: `database/scripts/FIX_BROKEN_DATA.sql`**

```sql
-- Fix broken data: Calculate missing actual_duration and sync status

-- Step 1: Calculate actual_duration for completed services
UPDATE service_progress sp
SET actual_duration = EXTRACT(EPOCH FROM (sp.end_time - sp.start_time)) / 60
WHERE sp.status = 'done' 
  AND sp.actual_duration IS NULL 
  AND sp.start_time IS NOT NULL 
  AND sp.end_time IS NOT NULL;

-- Step 2: Sync booking status - if progress is 'done', booking should be 'done'
UPDATE bookings b
SET status = 'done', updated_at = NOW()
FROM service_progress sp
WHERE b.id = sp.booking_id
  AND sp.status = 'done'
  AND b.status != 'done';

-- Step 3: If progress is 'in_progress', booking should be 'in_progress'
UPDATE bookings b
SET status = 'in_progress', updated_at = NOW()
FROM service_progress sp
WHERE b.id = sp.booking_id
  AND sp.status = 'in_progress'
  AND b.status != 'in_progress';

-- Verify the fix
SELECT 
  'Fixed Data Summary' as check_name,
  COUNT(*) FILTER (WHERE sp.status = 'done' AND sp.actual_duration IS NOT NULL) as done_with_duration,
  COUNT(*) FILTER (WHERE sp.status = 'done' AND sp.actual_duration IS NULL) as done_missing_duration,
  COUNT(*) FILTER (WHERE b.status = sp.status) as status_synced,
  COUNT(*) FILTER (WHERE b.status != sp.status) as status_not_synced
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.created_at > NOW() - INTERVAL '7 days';
```

**Expected Output:**
- `done_with_duration`: > 0 (bookings with calculated duration)
- `done_missing_duration`: 0 (no more missing durations)
- `status_synced`: > 0 (statuses are synced)
- `status_not_synced`: 0 (no more mismatches)

---

### Langkah 3: Verify Fix

Run query ini untuk verify semuanya sudah benar:

```sql
SELECT 
  b.id,
  b.status as booking_status,
  sp.status as progress_status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration,
  b.updated_at
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.created_at > NOW() - INTERVAL '1 day'
ORDER BY b.updated_at DESC
LIMIT 10;
```

**Expected Result:**
- ✅ `booking_status` = `progress_status` (synced!)
- ✅ Jika `progress_status = 'done'`, maka `actual_duration` harus ada nilai (bukan null)
- ✅ `updated_at` harus timestamp terbaru

---

## Setelah Run 3 Langkah Di Atas

1. **Hard Refresh Browser**: Ctrl+Shift+R
2. **Test Flow Baru**:
   - Customer buat booking baru
   - Admin assign mechanic
   - Mechanic klik "Mulai Servis" → counter "Sedang Dikerjakan" harus naik
   - Mechanic klik "Selesai Servis" → counter "Selesai" harus naik
3. **Check KPI Dashboard**: Harus muncul data completed bookings dan average service time

---

## Kenapa Ini Terjadi?

Migration 007 yang kamu run sebelumnya adalah **versi LAMA** yang belum ada fix `actual_duration`. Versi baru sudah diperbaiki tapi belum di-run di Supabase.

## Catatan Penting

- ✅ Setelah run Langkah 1, SEMUA booking baru akan otomatis calculate `actual_duration`
- ✅ Langkah 2 hanya untuk fix data lama yang sudah rusak
- ✅ Tidak perlu run migration lagi setelah ini
- ✅ Counter dashboard akan langsung update setelah fix ini

---

## Troubleshooting

**Q: Setelah run masih stuck?**
A: Hard refresh browser (Ctrl+Shift+R) dan clear cache

**Q: Error saat run script?**
A: Screenshot error dan kirim ke saya

**Q: Counter masih 0?**
A: Run query verify di Langkah 3 dan screenshot hasilnya
