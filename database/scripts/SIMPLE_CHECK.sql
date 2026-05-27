-- SIMPLE CHECK - Run ini dulu untuk diagnosis cepat

-- 1. Check if function has the fix (MOST IMPORTANT!)
SELECT 
  '1. Function Definition Check' as step,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%v_actual_duration := EXTRACT%' 
    THEN '✅ Function HAS the fix'
    ELSE '❌ Function DOES NOT have the fix - NEED TO UPDATE!'
  END as status
FROM pg_proc 
WHERE proname = 'complete_service_atomic';

-- 2. Check recent bookings (last 2 hours)
SELECT 
  '2. Recent Bookings' as step,
  b.id,
  b.status as booking_status,
  b.updated_at,
  sp.status as progress_status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration,
  m.name as mechanic_name
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
LEFT JOIN assignments a ON a.booking_id = b.id
LEFT JOIN mechanics m ON m.id = a.mechanic_id
WHERE b.created_at > NOW() - INTERVAL '2 hours'
ORDER BY b.created_at DESC
LIMIT 10;

-- 3. Check status sync issues
SELECT 
  '3. Status Sync Check' as step,
  COUNT(*) FILTER (WHERE b.status != sp.status) as mismatched,
  COUNT(*) FILTER (WHERE b.status = sp.status) as matched,
  COUNT(*) FILTER (WHERE sp.status = 'done' AND sp.actual_duration IS NULL) as done_no_duration,
  COUNT(*) FILTER (WHERE sp.status = 'done' AND sp.actual_duration IS NOT NULL) as done_with_duration
FROM bookings b
INNER JOIN service_progress sp ON sp.booking_id = b.id
WHERE b.created_at > NOW() - INTERVAL '1 day';

-- 4. Check for duplicate mechanics with same user_id
SELECT 
  '4. Duplicate Mechanic Check' as step,
  user_id,
  COUNT(*) as count,
  array_agg(name) as mechanic_names
FROM mechanics
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 5. Check bookings without assignments
SELECT 
  '5. Bookings Without Assignment' as step,
  b.id,
  b.status,
  b.created_at
FROM bookings b
LEFT JOIN assignments a ON a.booking_id = b.id
WHERE b.status IN ('confirmed', 'in_progress')
  AND a.mechanic_id IS NULL
  AND b.created_at > NOW() - INTERVAL '1 day'
LIMIT 5;
