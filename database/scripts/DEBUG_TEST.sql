-- Debug Test: Run this to see what's happening with your test booking

-- 1. Show the LATEST booking (your test booking)
SELECT 
  '1. Latest Booking' as step,
  b.id,
  b.status as booking_status,
  b.updated_at as booking_updated,
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
ORDER BY b.created_at DESC
LIMIT 1;

-- 2. Count bookings by status for YOUR mechanic
-- Replace YOUR_MECHANIC_ID with your actual mechanic ID from step 1
SELECT 
  '2. Counter Check' as step,
  COUNT(*) FILTER (WHERE b.status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE b.status = 'done') as done_count,
  COUNT(*) FILTER (WHERE b.status NOT IN ('done', 'cancelled')) as queue_count,
  array_agg(b.id) FILTER (WHERE b.status = 'in_progress') as in_progress_ids
FROM bookings b
INNER JOIN assignments a ON a.booking_id = b.id
WHERE a.mechanic_id = 'REPLACE_WITH_MECHANIC_ID_FROM_STEP_1';

-- 3. Check if start_service_atomic function exists and works
SELECT 
  '3. Function Check' as step,
  proname as function_name,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%v_actual_duration%' 
    THEN 'Has duration calculation'
    ELSE 'Missing duration calculation'
  END as has_fix
FROM pg_proc 
WHERE proname IN ('start_service_atomic', 'complete_service_atomic')
ORDER BY proname;
