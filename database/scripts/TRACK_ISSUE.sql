-- Track Issue: Run this BEFORE and AFTER clicking "Mulai Servis"
-- This will help us see exactly what changes (or doesn't change)

-- STEP 1: Run this BEFORE clicking "Mulai Servis"
-- Save the results as "BEFORE"

SELECT 
  'BEFORE - Booking State' as checkpoint,
  b.id as booking_id,
  b.status as booking_status,
  b.updated_at as booking_updated_at,
  sp.status as progress_status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration,
  a.mechanic_id,
  m.name as mechanic_name
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
LEFT JOIN assignments a ON a.booking_id = b.id
LEFT JOIN mechanics m ON m.id = a.mechanic_id
WHERE b.id = 'YOUR_BOOKING_ID' -- Replace with the booking you're about to start
ORDER BY b.updated_at DESC;

-- STEP 2: Click "Mulai Servis" in the UI

-- STEP 3: Wait 2 seconds

-- STEP 4: Run this AFTER clicking "Mulai Servis"
-- Save the results as "AFTER"

SELECT 
  'AFTER - Booking State' as checkpoint,
  b.id as booking_id,
  b.status as booking_status,
  b.updated_at as booking_updated_at,
  sp.status as progress_status,
  sp.start_time,
  sp.end_time,
  sp.actual_duration,
  a.mechanic_id,
  m.name as mechanic_name
FROM bookings b
LEFT JOIN service_progress sp ON sp.booking_id = b.id
LEFT JOIN assignments a ON a.booking_id = b.id
LEFT JOIN mechanics m ON m.id = a.mechanic_id
WHERE b.id = 'YOUR_BOOKING_ID' -- Same booking ID
ORDER BY b.updated_at DESC;

-- STEP 5: Compare BEFORE vs AFTER
-- What should change:
-- ✅ booking_status: 'confirmed' → 'in_progress'
-- ✅ progress_status: 'queued' → 'in_progress'
-- ✅ start_time: NULL → timestamp
-- ✅ booking_updated_at: should be newer timestamp

-- STEP 6: Check dashboard counter query
SELECT 
  'Dashboard Counter Check' as checkpoint,
  COUNT(*) FILTER (WHERE b.status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE b.status = 'done') as done_count,
  COUNT(*) FILTER (WHERE b.status NOT IN ('done', 'cancelled')) as queue_count,
  array_agg(b.id) FILTER (WHERE b.status = 'in_progress') as in_progress_booking_ids
FROM bookings b
INNER JOIN assignments a ON a.booking_id = b.id
WHERE a.mechanic_id = 'YOUR_MECHANIC_ID'; -- Replace with your mechanic ID
