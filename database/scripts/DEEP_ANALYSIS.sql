-- Deep Analysis: Why counter keeps getting stuck
-- Run this and send me ALL the results

-- 1. Check if function exists and its definition
SELECT 
  'Function Check' as analysis_step,
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname IN ('start_service_atomic', 'complete_service_atomic')
ORDER BY proname;

-- 2. Check recent bookings with FULL details
SELECT 
  '2. Recent Bookings Detail' as analysis_step,
  b.id,
  b.status as booking_status,
  b.created_at,
  b.updated_at,
  sp.status as progress_status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration,
  a.mechanic_id,
  m.name as mechanic_name,
  m.user_id as mechanic_user_id
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
LEFT JOIN assignments a ON a.booking_id = b.id
LEFT JOIN mechanics m ON m.id = a.mechanic_id
WHERE b.created_at > NOW() - INTERVAL '2 hours'
ORDER BY b.created_at DESC;

-- 3. Check for orphaned service_progress (no matching booking)
SELECT 
  '3. Orphaned Service Progress' as analysis_step,
  sp.*
FROM service_progress sp
LEFT JOIN bookings b ON b.id = sp.booking_id
WHERE b.id IS NULL;

-- 4. Check for bookings without service_progress
SELECT 
  '4. Bookings Without Progress' as analysis_step,
  b.id,
  b.status,
  b.created_at
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE sp.booking_id IS NULL
  AND b.status IN ('confirmed', 'in_progress', 'done')
  AND b.created_at > NOW() - INTERVAL '1 day';

-- 5. Check assignments table
SELECT 
  '5. Recent Assignments' as analysis_step,
  a.booking_id,
  a.mechanic_id,
  a.queue_position,
  b.status as booking_status,
  b.created_at as booking_created_at,
  sp.status as progress_status
FROM assignments a
LEFT JOIN bookings b ON b.id = a.booking_id
LEFT JOIN service_progress sp ON sp.booking_id = a.booking_id
WHERE b.created_at > NOW() - INTERVAL '2 hours'
ORDER BY b.created_at DESC;

-- 6. Count status mismatches
SELECT 
  '6. Status Mismatch Count' as analysis_step,
  COUNT(*) FILTER (WHERE b.status != sp.status) as mismatched_count,
  COUNT(*) FILTER (WHERE b.status = sp.status) as matched_count,
  COUNT(*) FILTER (WHERE sp.status = 'done' AND sp.actual_duration IS NULL) as done_without_duration,
  COUNT(*) FILTER (WHERE sp.status = 'done' AND sp.actual_duration IS NOT NULL) as done_with_duration
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.created_at > NOW() - INTERVAL '1 day';

-- 7. Check RLS policies on service_progress
SELECT 
  '7. RLS Policies' as analysis_step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('service_progress', 'bookings', 'assignments')
ORDER BY tablename, policyname;

-- 8. Test function execution (if you have a booking_id and user_id)
-- Replace with actual IDs from step 2
-- SELECT start_service_atomic('BOOKING_ID'::uuid, 'USER_ID'::uuid);
