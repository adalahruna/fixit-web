-- Fix broken data: Calculate missing actual_duration and sync status
-- Run this AFTER running FIX_ACTUAL_DURATION.sql

-- Step 1: Calculate actual_duration for completed services that are missing it
UPDATE service_progress sp
SET actual_duration = EXTRACT(EPOCH FROM (sp.end_time - sp.start_time)) / 60
WHERE sp.status = 'done' 
  AND sp.actual_duration IS NULL 
  AND sp.start_time IS NOT NULL 
  AND sp.end_time IS NOT NULL;

-- Step 2: Sync booking status with service_progress status
-- If service_progress is 'done', booking should be 'done'
UPDATE bookings b
SET status = 'done', updated_at = NOW()
FROM service_progress sp
WHERE b.id = sp.booking_id
  AND sp.status = 'done'
  AND b.status != 'done';

-- Step 3: If service_progress is 'in_progress', booking should be 'in_progress'
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
