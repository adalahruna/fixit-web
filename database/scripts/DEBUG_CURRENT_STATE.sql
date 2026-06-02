-- DEBUG: Check current state of all data

-- 1. Check bookings and service_progress relationship
SELECT 
  'Bookings vs Service Progress' as check_name,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT sp.booking_id) as bookings_with_progress,
  COUNT(DISTINCT b.id) - COUNT(DISTINCT sp.booking_id) as missing_progress
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id;

-- 2. Check booking statuses
SELECT 
  'Booking Status Breakdown' as check_name,
  status,
  COUNT(*) as count
FROM bookings
GROUP BY status
ORDER BY count DESC;

-- 3. Check service_progress statuses
SELECT 
  'Service Progress Status' as check_name,
  sp.status,
  COUNT(*) as count
FROM service_progress sp
GROUP BY sp.status
ORDER BY count DESC;

-- 4. Check mismatched statuses
SELECT 
  'Status Mismatches' as check_name,
  b.id,
  b.status as booking_status,
  sp.status as progress_status,
  b.schedule_start,
  sp.start_time,
  sp.end_time,
  sp.actual_duration
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE (
  (b.status = 'in_progress' AND (sp.status IS NULL OR sp.status != 'in_progress')) OR
  (b.status = 'done' AND (sp.status IS NULL OR sp.status != 'done')) OR
  (b.status = 'confirmed' AND (sp.status IS NULL OR sp.status != 'queued'))
)
ORDER BY b.schedule_start DESC
LIMIT 10;

-- 5. Check done bookings without actual_duration
SELECT 
  'Done Without Duration' as check_name,
  b.id,
  b.status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration,
  b.schedule_start,
  b.schedule_end
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'done'
ORDER BY b.schedule_start DESC
LIMIT 10;

-- 6. Check in_progress bookings
SELECT 
  'In Progress Bookings' as check_name,
  b.id,
  b.status as booking_status,
  sp.status as progress_status,
  sp.start_time,
  b.schedule_start
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status = 'in_progress'
ORDER BY b.schedule_start DESC;

-- 7. Check if complete_service_atomic function exists
SELECT 
  'Function Check' as check_name,
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'complete_service_atomic';

-- 8. Sample raw data
SELECT 
  'Sample Raw Data' as check_name,
  b.id,
  b.status,
  b.created_at,
  b.schedule_start,
  b.schedule_end,
  sp.status as sp_status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
ORDER BY b.created_at DESC
LIMIT 15;
