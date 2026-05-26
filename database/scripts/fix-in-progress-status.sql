-- Script to fix in_progress status issues
-- Run this in Supabase SQL Editor

-- 1. Check if atomic functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('start_service_atomic', 'complete_service_atomic');

-- 2. If functions don't exist, you need to run migration 007 first
-- See: database/migrations/007_atomic_status_functions.sql

-- 3. Fix any bookings that have service_progress with start_time but status is still 'queued'
UPDATE bookings b
SET status = 'in_progress'
FROM service_progress sp
WHERE b.id = sp.booking_id
AND sp.start_time IS NOT NULL
AND sp.end_time IS NULL
AND b.status = 'queued';

-- 4. Fix any service_progress that have start_time but status is still 'queued'
UPDATE service_progress
SET status = 'in_progress'
WHERE start_time IS NOT NULL
AND end_time IS NULL
AND status = 'queued';

-- 5. Verify the fixes
SELECT 
  b.id as booking_id,
  b.status as booking_status,
  sp.status as progress_status,
  sp.start_time,
  sp.end_time,
  a.mechanic_id
FROM bookings b
LEFT JOIN service_progress sp ON b.id = sp.booking_id
LEFT JOIN assignments a ON b.id = a.booking_id
WHERE b.status = 'in_progress' OR sp.status = 'in_progress'
ORDER BY sp.start_time DESC;
