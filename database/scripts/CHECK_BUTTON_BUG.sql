-- CHECK BUTTON BUG: Kenapa tombol "Mulai Servis" tidak bisa diklik?

-- 1. Check booking yang ada di queue mechanic
SELECT 
  '1. Bookings in Queue' as step,
  b.id,
  b.status as booking_status,
  b.customer_id,
  sp.status as progress_status,
  sp.start_time,
  a.mechanic_id,
  m.name as mechanic_name,
  m.user_id as mechanic_user_id
FROM bookings b
INNER JOIN assignments a ON a.booking_id = b.id
INNER JOIN mechanics m ON m.id = a.mechanic_id
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.status NOT IN ('done', 'cancelled')
ORDER BY b.created_at DESC;

-- 2. Check service_progress records
SELECT 
  '2. Service Progress Records' as step,
  sp.id,
  sp.booking_id,
  sp.status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration,
  b.status as booking_status
FROM service_progress sp
LEFT JOIN bookings b ON b.id = sp.booking_id
ORDER BY sp.created_at DESC
LIMIT 10;

-- 3. Check for bookings with wrong status combination
SELECT 
  '3. Wrong Status Combinations' as step,
  b.id as booking_id,
  b.status as booking_status,
  sp.status as progress_status,
  CASE 
    WHEN b.status = 'confirmed' AND sp.status != 'queued' THEN '❌ Should be queued'
    WHEN b.status = 'in_progress' AND sp.status != 'in_progress' THEN '❌ Should be in_progress'
    WHEN b.status = 'done' AND sp.status != 'done' THEN '❌ Should be done'
    WHEN b.status = 'pending' AND sp.id IS NOT NULL THEN '❌ Should not have service_progress'
    WHEN b.status = 'cancelled' AND sp.id IS NOT NULL THEN '❌ Should not have service_progress'
    ELSE '✅ OK'
  END as validation
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.created_at > NOW() - INTERVAL '1 day'
ORDER BY b.created_at DESC;

-- 4. Test start_service_atomic function with a specific booking
-- REPLACE booking_id and user_id with actual values from step 1
-- SELECT start_service_atomic('BOOKING_ID_HERE'::uuid, 'USER_ID_HERE'::uuid);

-- 5. Check if there are any triggers that might be interfering
SELECT 
  '5. Active Triggers' as step,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('bookings', 'service_progress', 'assignments')
ORDER BY event_object_table, trigger_name;
