# Fix KPI/SLA Showing 0/0 Bookings

## Root Cause
The atomic functions in Migration 007 had two critical bugs:
1. `complete_service_atomic` was NOT calculating `actual_duration`
2. `complete_service_atomic` was NOT updating `bookings.status` to `done`

This caused:
- KPI dashboard to show 0 completed bookings (filters by `status = 'done'`)
- Average service time to show 0 (no `actual_duration` data)
- SLA page to show 0/0 bookings
- Mechanic dashboard counters to be incorrect

## Solution
Updated both atomic functions to:
- `start_service_atomic`: Now updates `bookings.status` to `in_progress` (with `updated_at`)
- `complete_service_atomic`: Now calculates `actual_duration` and updates `bookings.status` to `done`

## Steps to Fix

### 1. Run Updated Migration in Supabase
1. Open Supabase SQL Editor
2. Copy and paste the entire content of `database/scripts/run-migration-007.sql`
3. Click "Run" to execute
4. Verify success message

### 2. Test the Full Flow
1. **Customer**: Create a new booking
2. **Admin**: Assign a mechanic to the booking
3. **Mechanic**: 
   - Click "Mulai Servis" 
   - Verify status badge changes to "Sedang Dikerjakan"
   - Verify counter "Sedang Dikerjakan" increases
4. **Mechanic**: 
   - Click "Selesai Servis"
   - Verify status badge changes to "Selesai"
   - Verify counter "Selesai" increases
5. **Admin**: Check KPI Dashboard
   - Verify "Total Bookings" shows correct count
   - Verify "Completed Bookings" shows the completed booking
   - Verify "Avg Service Time" shows actual duration (not 0)
6. **Admin**: Check SLA Page
   - Verify shows correct booking counts (not 0/0)
   - Verify "On-Time Rate" shows percentage

### 3. Verify Database State
Run this query in Supabase SQL Editor to verify:

```sql
SELECT 
  b.id,
  b.status as booking_status,
  sp.status as progress_status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.created_at > NOW() - INTERVAL '1 day'
ORDER BY b.created_at DESC;
```

Expected results:
- Bookings that were started should have `booking_status = 'in_progress'` and `progress_status = 'in_progress'`
- Bookings that were completed should have `booking_status = 'done'` and `progress_status = 'done'`
- Completed bookings should have `actual_duration` calculated (not NULL or 0)

## What Changed

### Before (Broken)
```sql
-- complete_service_atomic did NOT calculate actual_duration
UPDATE service_progress 
SET status = 'done', end_time = NOW()
WHERE booking_id = p_booking_id;

UPDATE bookings 
SET status = 'done'
WHERE id = p_booking_id;
```

### After (Fixed)
```sql
-- Get start_time first
SELECT start_time INTO v_start_time
FROM service_progress
WHERE booking_id = p_booking_id AND status = 'in_progress';

-- Calculate actual duration in minutes
v_actual_duration := EXTRACT(EPOCH FROM (NOW() - v_start_time)) / 60;

-- Update with calculated duration
UPDATE service_progress 
SET status = 'done', end_time = NOW(), actual_duration = v_actual_duration
WHERE booking_id = p_booking_id;

UPDATE bookings 
SET status = 'done', updated_at = NOW()
WHERE id = p_booking_id;
```

## Files Modified
- `database/migrations/007_atomic_status_functions.sql` - Fixed both functions
- `database/scripts/run-migration-007.sql` - Updated script to run in Supabase

## Notes
- All existing bookings with status `confirmed` will remain as-is
- Only NEW bookings after running the fix will have correct status flow
- If you want to test with existing bookings, you can manually update their status to `pending` and reassign mechanics
