-- Fix mismatched status between bookings and service_progress
-- Run this to sync the 2 mismatched bookings

-- Step 1: Show which bookings are mismatched
SELECT 
  'Mismatched Bookings' as check_name,
  b.id,
  b.status as booking_status,
  sp.status as progress_status,
  b.updated_at,
  sp.start_time,
  sp.end_time,
  sp.actual_duration
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status != sp.status
  AND b.created_at > NOW() - INTERVAL '1 day'
ORDER BY b.updated_at DESC;

-- Step 2: Fix the mismatches
-- If service_progress is 'done', booking should be 'done'
UPDATE bookings b
SET status = 'done', updated_at = NOW()
FROM service_progress sp
WHERE b.id = sp.booking_id
  AND sp.status = 'done'
  AND b.status != 'done';

-- If service_progress is 'in_progress', booking should be 'in_progress'
UPDATE bookings b
SET status = 'in_progress', updated_at = NOW()
FROM service_progress sp
WHERE b.id = sp.booking_id
  AND sp.status = 'in_progress'
  AND b.status != 'in_progress';

-- If service_progress is 'queued', booking should be 'confirmed'
UPDATE bookings b
SET status = 'confirmed', updated_at = NOW()
FROM service_progress sp
WHERE b.id = sp.booking_id
  AND sp.status = 'queued'
  AND b.status != 'confirmed';

-- Step 3: Verify fix
SELECT 
  'After Fix' as check_name,
  COUNT(*) FILTER (WHERE b.status != sp.status) as still_mismatched,
  COUNT(*) FILTER (WHERE b.status = sp.status) as now_matched
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.created_at > NOW() - INTERVAL '1 day';
